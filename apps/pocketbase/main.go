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
		"the ip:port address to bind pprof to (optional)",
	)

	var hooksDir string
	app.RootCmd.PersistentFlags().StringVar(
		&hooksDir,
		"hooksDir",
		"",
		"the directory with the JS app hooks",
	)

	var hooksWatch bool
	app.RootCmd.PersistentFlags().BoolVar(
		&hooksWatch,
		"hooksWatch",
		true,
		"auto restart the app on pb_hooks file change; it has no effect on Windows",
	)

	var hooksPool int
	app.RootCmd.PersistentFlags().IntVar(
		&hooksPool,
		"hooksPool",
		15,
		"the total prewarm goja.Runtime instances for the JS app hooks execution",
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

	// load jsvm (pb_hooks and pb_migrations)
	jsvm.MustRegister(app, jsvm.Config{
		MigrationsDir: migrationsDir,
		HooksDir:      hooksDir,
		HooksWatch:    hooksWatch,
		HooksPoolSize: hooksPool,
	})

	// migrate command (with js templates)
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangJS,
		Automigrate:  automigrate,
		Dir:          migrationsDir,
	})

	// Start pprof server if address is specified
	if pprofAddr != "" {
		go func() {
			log.Println("pprof started at:", "http://"+pprofAddr+"/debug/pprof/")
			if err := http.ListenAndServe(pprofAddr, nil); err != nil {
				log.Printf("pprof server error: %v", err)
			}
		}()
	}

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		if err := pb_go.InitMobCache(se.App); err != nil {
			log.Printf("Failed to initialize mob cache: %v", err)
		}
		se.Router.POST("/api/create-hp-report", pb_go.CreateHPReportHandler(se.App))
		return se.Next()
	})

	// Filter specific expected errors from logs to reduce noise
	app.OnModelCreate(core.LogsTableName).BindFunc(func(e *core.ModelEvent) error {
		l := e.Model.(*core.Log)

		// Only filter error logs (level 8)
		if l.Level != 8 {
			return e.Next()
		}

		// Error messages that should not be logged
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
