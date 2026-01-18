pub fn format_number(n: f32) -> String {
    let n = n as i64;
    let s = n.to_string();
    let mut result = String::new();
    for (i, c) in s.chars().rev().enumerate() {
        if i > 0 && i % 3 == 0 {
            result.push(',');
        }
        result.push(c);
    }
    result.chars().rev().collect()
}

/// Format number with K/M/B/T suffixes (e.g., 1.2K, 342K, 1.5M)
/// Returns (formatted_string, raw_number_string) for hover tooltips
pub fn format_compact(value: f32) -> (String, String) {
    let raw = format_number(value);

    let abs_value = value.abs();

    if abs_value < 1000.0 {
        (format!("{:.0}", value), raw)
    } else if abs_value < 1_000_000.0 {
        let k = value / 1000.0;
        if k >= 100.0 {
            (format!("{:.0}K", k), raw)
        } else {
            (format!("{:.1}K", k), raw)
        }
    } else if abs_value < 1_000_000_000.0 {
        let m = value / 1_000_000.0;
        if m >= 100.0 {
            (format!("{:.0}M", m), raw)
        } else {
            (format!("{:.1}M", m), raw)
        }
    } else if abs_value < 1_000_000_000_000.0 {
        let b = value / 1_000_000_000.0;
        if b >= 100.0 {
            (format!("{:.0}B", b), raw)
        } else {
            (format!("{:.1}B", b), raw)
        }
    } else {
        let t = value / 1_000_000_000_000.0;
        if t >= 100.0 {
            (format!("{:.0}T", t), raw)
        } else {
            (format!("{:.1}T", t), raw)
        }
    }
}
