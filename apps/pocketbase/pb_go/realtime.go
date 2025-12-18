package pb_go

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

type UpdateBatcher struct {
	updates map[string]*MobUpdate // Key: "mobID:channel:region"
	mu      sync.Mutex
	ticker  *time.Ticker
	app     core.App
}

var globalBatcher *UpdateBatcher

// InitRealtimeHooks sets up SSE broadcasting for HP updates and mob resets.
// Updates are batched every 200ms.
func InitRealtimeHooks(app core.App) {
	globalBatcher = &UpdateBatcher{
		updates: make(map[string]*MobUpdate),
		ticker:  time.NewTicker(sseBatchInterval),
		app:     app,
	}

	go globalBatcher.worker()

	app.OnRecordAfterCreateSuccess(COLLECTION_HP_REPORTS).BindFunc(func(e *core.RecordEvent) error {
		mobID := e.Record.GetString("mob")
		channelNumber := e.Record.GetInt("channel_number")
		hpPercentage := e.Record.GetInt("hp_percentage")
		region := e.Record.GetString("region")

		var locationImage *int
		if locImg := e.Record.GetInt("location_image"); locImg > 0 {
			locationImage = &locImg
		}

		globalBatcher.Add(MobUpdate{
			MobID:         mobID,
			ChannelNumber: channelNumber,
			HPPercentage:  hpPercentage,
			Region:        region,
			LocationImage: locationImage,
		})

		if err := updateMobChannelStatus(e.App, mobID, channelNumber, hpPercentage, region, locationImage); err != nil {
			log.Printf("[REALTIME] mob_channel_status update error=%v", err)
		}

		return e.Next()
	})

	app.OnRealtimeConnectRequest().BindFunc(func(e *core.RealtimeConnectRequestEvent) error {
		e.IdleTimeout = sseIdleTimeout
		return e.Next()
	})

	log.Printf("[REALTIME] Hook registered ms_interval=%d", SSE_BATCH_INTERVAL_MS)
}

func (b *UpdateBatcher) Add(update MobUpdate) {
	b.mu.Lock()
	defer b.mu.Unlock()

	key := fmt.Sprintf("%s:%d:%s", update.MobID, update.ChannelNumber, update.Region)
	b.updates[key] = &update
}

func (b *UpdateBatcher) worker() {
	for range b.ticker.C {
		b.flush()
	}
}

func (b *UpdateBatcher) flush() {
	b.mu.Lock()

	if len(b.updates) == 0 {
		b.mu.Unlock()
		return
	}

	// Group updates by region
	updatesByRegion := make(map[string][]*MobUpdate)
	for _, update := range b.updates {
		region := update.Region
		if region == "" {
			log.Printf("[REALTIME] WARNING: update with empty region, mob=%s channel=%d", update.MobID, update.ChannelNumber)
			continue
		}
		updatesByRegion[region] = append(updatesByRegion[region], update)
	}
	b.updates = make(map[string]*MobUpdate)

	b.mu.Unlock()

	// Broadcast each region separately
	for region, updates := range updatesByRegion {
		b.broadcast(updates, region)
	}
}

// getHPUpdatesTopic returns the topic name for HP updates based on region.
// NA uses the default topic (mob_hp_updates) for backwards compatibility,
// other regions use region-specific topics (e.g., mob_hp_updates_sea for SEA).
func getHPUpdatesTopic(region string) string {
	if region == "NA" {
		return SSE_TOPIC_HP_UPDATES
	}
	return fmt.Sprintf("mob_hp_updates_%s", strings.ToLower(region))
}

func (b *UpdateBatcher) broadcast(updates []*MobUpdate, region string) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[REALTIME] PANIC in broadcast: %v", r)
		}
	}()

	broker := b.app.SubscriptionsBroker()
	clients := broker.Clients()

	topic := getHPUpdatesTopic(region)

	batchPayload := make([][]interface{}, 0, len(updates))
	for _, update := range updates {
		payload := make([]interface{}, 4)
		payload[0] = update.MobID
		payload[1] = update.ChannelNumber
		payload[2] = update.HPPercentage
		if update.LocationImage != nil {
			payload[3] = *update.LocationImage
		} else {
			payload[3] = nil
		}
		batchPayload = append(batchPayload, payload)
	}

	data, err := json.Marshal(batchPayload)
	if err != nil {
		log.Printf("[REALTIME] batch marshal error=%v", err)
		return
	}

	message := subscriptions.Message{
		Name: topic,
		Data: data,
	}

	droppedCount := 0
	sentCount := 0

	// Send to all subscribed clients
	for _, client := range clients {
		if !client.HasSubscription(topic) {
			continue
		}

		// Catch panic per-client to handle closed channels gracefully
		func() {
			defer func() {
				if r := recover(); r != nil {
					droppedCount++
					if droppedCount%100 == 1 {
						log.Printf("[REALTIME] client panic (likely closed channel): %v", r)
					}
				}
			}()

			select {
			case client.Channel() <- message:
				sentCount++
			default:
				droppedCount++
				if droppedCount%100 == 1 {
					log.Printf("[REALTIME] dropped=%d sent=%d (client channels full)", droppedCount, sentCount)
				}
			}
		}()
	}

	// Log summary if there were significant drops
	if droppedCount > 0 {
		log.Printf("[REALTIME] broadcast complete: region=%s sent=%d dropped=%d total_clients=%d", region, sentCount, droppedCount, len(clients))
	}
}

func updateMobChannelStatus(app core.App, mobID string, channelNumber int, hpPercentage int, region string, locationImage *int) error {
	record, err := app.FindFirstRecordByFilter(
		COLLECTION_MOB_CHANNEL_STATUS,
		"mob = {:mobId} && channel_number = {:channelNumber} && region = {:region}",
		map[string]any{
			"mobId":         mobID,
			"channelNumber": channelNumber,
			"region":        region,
		},
	)

	if err != nil {
		// Use app.Store() to cache collection lookup (thread-safe)
		collection := app.Store().GetOrSet(COLLECTION_CACHE_KEY, func() any {
			col, err := app.FindCollectionByNameOrId(COLLECTION_MOB_CHANNEL_STATUS)
			if err != nil {
				log.Printf("[REALTIME] collection cache error=%v", err)
				return nil
			}
			return col
		})

		if collection == nil {
			col, err := app.FindCollectionByNameOrId(COLLECTION_MOB_CHANNEL_STATUS)
			if err != nil {
				return fmt.Errorf("failed to find collection: %w", err)
			}
			record = core.NewRecord(col)
		} else {
			record = core.NewRecord(collection.(*core.Collection))
		}
		record.Set("mob", mobID)
		record.Set("channel_number", channelNumber)
		record.Set("region", region)
	}

	record.Set("last_hp", hpPercentage)
	record.Set("last_update", time.Now().Format("2006-01-02 15:04:05"))

	if locationImage != nil {
		record.Set("location_image", *locationImage)
	}

	return app.Save(record)
}
