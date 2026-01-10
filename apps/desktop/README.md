# BPTimer Desktop

Native overlay companion app for [BPTimer.com](https://bptimer.com).

## Requirements

- [Rust](https://rustup.rs)
- [Npcap](https://npcap.com)

## Development

```sh
cargo run
```

## Build

```sh
cargo build --release
```

The binary will be at `target/release/`.

### Installer

Requires [Inno Setup](https://jrsoftware.org/isinfo.php):

```sh
bun run build:installer
```

## Configuration

The app stores settings in `%APPDATA%/bptimer-desktop/settings.json`.

Environment variables:

- `BPTIMER_API_URL` - API endpoint (Timers and HP reporting)
- `BPTIMER_API_KEY` - API key from [bptimer.com](https://bptimer.com) (Needed for HP reporting)
