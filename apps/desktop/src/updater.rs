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
