use log::{error, info, warn};
use self_update::{Status, cargo_crate_version};

#[derive(Debug, Clone)]
pub enum UpdateStatus {
    Checking,
    Available(String),
    UpToDate,
    Updating,
    Updated(String),
    Error(String),
}

pub fn check_for_updates() -> Result<UpdateStatus, Box<dyn std::error::Error>> {
    let repo_owner = crate::GITHUB_REPO_OWNER;
    let repo_name = crate::GITHUB_REPO_NAME;
    let current_version = cargo_crate_version!();

    info!(
        "Checking for updates (current version: {})",
        current_version
    );

    let updater = self_update::backends::github::Update::configure()
        .repo_owner(repo_owner)
        .repo_name(repo_name)
        .bin_name("bptimer-desktop")
        .current_version(current_version)
        .build()?;

    match updater.get_latest_release() {
        Ok(latest_release) => {
            if latest_release.version != current_version {
                info!(
                    "Update available: {} -> {}",
                    current_version, latest_release.version
                );
                Ok(UpdateStatus::Available(latest_release.version))
            } else {
                info!("Application is up to date: {}", current_version);
                Ok(UpdateStatus::UpToDate)
            }
        }
        Err(_) => match updater.update() {
            Ok(Status::UpToDate(_)) => {
                info!("Application is up to date: {}", current_version);
                Ok(UpdateStatus::UpToDate)
            }
            Ok(Status::Updated(v)) => {
                info!("Update was installed: {}", v);
                Ok(UpdateStatus::Updated(v))
            }
            Err(e) => {
                let err_str = e.to_string().to_lowercase();
                if err_str.contains("no update")
                    || err_str.contains("up to date")
                    || err_str.contains("already up to date")
                {
                    info!("Application is up to date: {}", current_version);
                    Ok(UpdateStatus::UpToDate)
                } else {
                    warn!("Error checking for updates: {}", e);
                    Err(Box::new(e))
                }
            }
        },
    }
}

#[cfg(windows)]
fn restart_process(exe_path: std::path::PathBuf) {
    use std::os::windows::process::CommandExt;
    use std::process::Command;
    use std::thread;
    use std::time::Duration;

    // Wait to allow self_replace's batch script to complete the replacement
    info!("Waiting 5 seconds before restarting to allow update replacement to complete...");
    thread::sleep(Duration::from_secs(5));

    // Spawn new process in a new console and exit current process
    const CREATE_NEW_CONSOLE: u32 = 0x0000_0010;
    match Command::new(&exe_path)
        .args(std::env::args().skip(1))
        .creation_flags(CREATE_NEW_CONSOLE)
        .spawn()
    {
        Ok(_) => {
            info!("Successfully spawned new process, exiting...");
            std::process::exit(0);
        }
        Err(err) => {
            error!("Failed to restart process: {}", err);
            std::process::exit(1);
        }
    }
}

#[cfg(not(windows))]
fn restart_process(exe_path: std::path::PathBuf) {
    use std::os::unix::process::CommandExt;
    use std::process::Command;

    // On Unix, we can use exec() to replace the current process
    let err = Command::new(&exe_path)
        .args(std::env::args().skip(1))
        .exec();
    error!("Failed to restart process: {}", err);
}

pub fn schedule_restart_and_exit() {
    if let Ok(exe_path) = std::env::current_exe() {
        info!("Scheduling restart after update...");
        restart_process(exe_path);
    } else {
        error!("Failed to get current executable path");
        std::process::exit(1);
    }
}

pub fn perform_update() -> Result<UpdateStatus, Box<dyn std::error::Error>> {
    let repo_owner = crate::GITHUB_REPO_OWNER;
    let repo_name = crate::GITHUB_REPO_NAME;
    let current_version = cargo_crate_version!();

    info!("Performing update (current version: {})", current_version);

    let updater = self_update::backends::github::Update::configure()
        .repo_owner(repo_owner)
        .repo_name(repo_name)
        .bin_name("bptimer-desktop")
        .current_version(current_version)
        .show_download_progress(true)
        .build()?;

    match updater.update() {
        Ok(status) => match status {
            Status::UpToDate(v) => {
                info!("Application is up to date: {}", v);
                Ok(UpdateStatus::UpToDate)
            }
            Status::Updated(v) => {
                info!("Successfully updated to version: {}", v);
                Ok(UpdateStatus::Updated(v))
            }
        },
        Err(e) => {
            error!("Failed to update: {}", e);
            Ok(UpdateStatus::Error(e.to_string()))
        }
    }
}

pub fn perform_update_with_status_handling(status: std::sync::Arc<std::sync::Mutex<UpdateStatus>>) {
    if let Ok(mut s) = status.lock() {
        *s = UpdateStatus::Updating;
    }

    match perform_update() {
        Ok(update_status) => {
            if let Ok(mut s) = status.lock() {
                *s = update_status.clone();
            }
            if matches!(update_status, UpdateStatus::Updated(_)) {
                schedule_restart_and_exit();
            }
        }
        Err(e) => {
            warn!("Failed to perform update: {}", e);
            if let Ok(mut s) = status.lock() {
                *s = UpdateStatus::Error(e.to_string());
            }
        }
    }
}
