package main

import (
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/jsvm"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/woheedev/bptimer/apps/pocketbase/pb_go"
)

func main() {
	app := pocketbase.New()

	// ---------------------------------------------------------------
	// Optional plugin flags:
	// ---------------------------------------------------------------

	var pprofAddr string
	app.RootCmd.PersistentFlags().StringVar(
		&pprofAddr,
		"pprof",
		"",
		"the ip:port address to bind pprof and metrics to (optional)",
	)

	var migrationsDir string
	app.RootCmd.PersistentFlags().StringVar(
		&migrationsDir,
		"migrationsDir",
		"",
		"the directory with the user defined migrations",
	)

	var automigrate bool
	app.RootCmd.PersistentFlags().BoolVar(
		&automigrate,
		"automigrate",
		true,
		"enable/disable auto migrations",
	)

	app.RootCmd.ParseFlags(os.Args[1:])

	// ---------------------------------------------------------------
	// Plugins and hooks:
	// ---------------------------------------------------------------

	// Load jsvm for migrations
	jsvm.MustRegister(app, jsvm.Config{
		MigrationsDir: migrationsDir,
	})

	// Migrate command (with js templates)
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangJS,
		Automigrate:  automigrate,
		Dir:          migrationsDir,
	})

	// Start pprof + metrics server if address is specified
	if pprofAddr != "" {
		mux := http.NewServeMux()

		mux.Handle("/debug/", http.DefaultServeMux)
		mux.Handle("/metrics", promhttp.Handler())

		go func() {
			log.Printf("pprof started at: http://%s/debug/pprof/", pprofAddr)
			log.Printf("metrics started at: http://%s/metrics", pprofAddr)
			if err := http.ListenAndServe(pprofAddr, mux); err != nil {
				log.Printf("pprof/metrics server error: %v", err)
			}
		}()
	}

	pb_go.InitHPReportsHooks(app)
	pb_go.InitVoteHooks(app)
	pb_go.InitRealtimeHooks(app)
	pb_go.InitCronJobs(app)

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// Mob cache must initialize successfully for API endpoint to work
		if err := pb_go.InitMobCache(se.App); err != nil {
			log.Fatalf("[FATAL] Failed to initialize mob cache: %v", err)
		}

		se.Router.POST("/api/create-hp-report", pb_go.CreateHPReportHandler(se.App))

		log.Printf("[API] /api/create-hp-report registered")
		return se.Next()
	})

	// Filter expected validation errors from logs to reduce noise
	app.OnModelCreate(core.LogsTableName).BindFunc(func(e *core.ModelEvent) error {
		l := e.Model.(*core.Log)

		// Only filter error logs (level 8)
		if l.Level != 8 {
			return e.Next()
		}

		// Don't log these expected validation errors
		filteredErrors := []string{
			"You have already reported this HP percentage.",
			"failed to save hp report: You have already reported this HP percentage.",
		}

		if errorMsg, ok := l.Data["error"].(string); ok {
			for _, filteredErr := range filteredErrors {
				if errorMsg == filteredErr {
					return nil
				}
			}
		}

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
