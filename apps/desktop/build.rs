use std::env;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR")?);

    prost_build::Config::new()
        .out_dir(&manifest_dir.join("src/protocol"))
        .compile_protos(&["src/pb.proto"], &["src/"])?;

    // Add #[rustfmt::skip] to the generated pb.rs file to skip formatting
    let pb_rs_path = manifest_dir.join("src/protocol/pb.rs");
    if pb_rs_path.exists() {
        let mut content = String::new();
        {
            let mut file = File::open(&pb_rs_path)?;
            file.read_to_string(&mut content)?;
        }

        // Only add if not already present
        if !content.starts_with("#[rustfmt::skip]") {
            let mut file = OpenOptions::new()
                .write(true)
                .truncate(true)
                .open(&pb_rs_path)?;
            writeln!(file, "#[rustfmt::skip]")?;
            file.write_all(content.as_bytes())?;
        }
    }

    let out_dir = env::var("OUT_DIR")?;
    let dest_path = PathBuf::from(&out_dir).join("config.rs");
    let mut config_file = File::create(&dest_path)?;

    let api_url = env::var("BPTIMER_API_URL").unwrap_or_else(|_| String::new());
    let api_key = env::var("BPTIMER_API_KEY").unwrap_or_else(|_| String::new());

    #[cfg(not(debug_assertions))]
    {
        if api_url.is_empty() {
            panic!("BPTIMER_API_URL environment variable is required for release builds");
        }
        if api_key.is_empty() {
            panic!("BPTIMER_API_KEY environment variable is required for release builds");
        }
    }

    let repo_owner = env::var("GITHUB_REPO_OWNER").unwrap_or_else(|_| "woheedev".to_string());
    let repo_name = env::var("GITHUB_REPO_NAME").unwrap_or_else(|_| "bptimer".to_string());

    writeln!(
        config_file,
        "pub const BPTIMER_API_URL: &str = \"{}\";",
        api_url
    )?;
    writeln!(
        config_file,
        "pub const BPTIMER_API_KEY: &str = \"{}\";",
        api_key
    )?;
    writeln!(
        config_file,
        "pub const GITHUB_REPO_OWNER: &str = \"{}\";",
        repo_owner
    )?;
    writeln!(
        config_file,
        "pub const GITHUB_REPO_NAME: &str = \"{}\";",
        repo_name
    )?;

    #[cfg(windows)]
    {
        let icon_path = manifest_dir
            .join("..")
            .join("web")
            .join("static")
            .join("favicon.ico");
        if icon_path.exists() {
            let mut res = winres::WindowsResource::new();
            res.set_icon(icon_path.to_str().unwrap());
            res.set_language(0x0409); // English (US)
            res.compile()?;
        }

        // Configure Npcap SDK library path for linking
        if let Ok(libdir) = env::var("PCAP_LIBDIR") {
            println!("cargo:rustc-link-search=native={}", libdir);
        } else {
            // Fallback: try common installation paths
            let common_paths = [
                "C:\\npcap-sdk\\Lib\\x64",
                "C:\\Program Files\\Npcap\\Lib\\x64",
            ];
            let mut found = false;
            for path in &common_paths {
                if std::path::Path::new(path).exists() {
                    println!("cargo:rustc-link-search=native={}", path);
                    found = true;
                    break;
                }
            }
            if !found {
                eprintln!("Warning: PCAP_LIBDIR not set and no Npcap SDK found in common paths.");
                eprintln!("Set PCAP_LIBDIR environment variable or install Npcap SDK.");
            }
        }
    }

    println!("cargo:rerun-if-changed=src/pb.proto");
    println!("cargo:rerun-if-env-changed=BPTIMER_API_URL");
    println!("cargo:rerun-if-env-changed=BPTIMER_API_KEY");
    println!("cargo:rerun-if-env-changed=GITHUB_REPO_OWNER");
    println!("cargo:rerun-if-env-changed=GITHUB_REPO_NAME");
    println!("cargo:rerun-if-env-changed=PCAP_LIBDIR");

    Ok(())
}
