package pb_go

import (
	"errors"
	"strconv"
	"strings"
)

// validateUserAgentVersion checks if the user agent version meets the minimum requirement.
// Expected format: "AppName/version" (e.g., "BPSR-Logs/0.23.0")
// Returns an error if the app is known and the version is too old, nil otherwise.
func validateUserAgentVersion(userAgent string) error {
	if userAgent == "" {
		return nil
	}

	parts := strings.SplitN(userAgent, "/", 2)
	if len(parts) != 2 {
		return nil
	}

	appName := strings.TrimSpace(parts[0])
	version := strings.TrimSpace(parts[1])
	if appName == "" || version == "" {
		return nil
	}

	minVersion, exists := MinAppVersions[appName]
	if !exists {
		return nil
	}

	if compareVersions(version, minVersion) < 0 {
		return errors.New("version too old")
	}

	return nil
}

// getMinVersionForUserAgent extracts the minimum required version for a user agent.
// Returns empty string if app is not found or user agent is malformed.
func getMinVersionForUserAgent(userAgent string) string {
	if userAgent == "" {
		return ""
	}

	parts := strings.SplitN(userAgent, "/", 2)
	if len(parts) != 2 {
		return ""
	}

	appName := strings.TrimSpace(parts[0])
	if appName == "" {
		return ""
	}

	if minVersion, exists := MinAppVersions[appName]; exists {
		return minVersion
	}

	return ""
}

// compareVersions compares two semantic versions (handles "0.23.0" or "v0.23.0").
// Returns negative if v1 < v2, zero if equal, positive if v1 > v2.
// Non-numeric parts are treated as 0 (fail-safe: blocks malformed versions).
func compareVersions(v1, v2 string) int {
	v1 = strings.TrimPrefix(strings.TrimSpace(v1), "v")
	v2 = strings.TrimPrefix(strings.TrimSpace(v2), "v")

	parts1 := strings.Split(v1, ".")
	parts2 := strings.Split(v2, ".")

	maxLen := len(parts1)
	if len(parts2) > maxLen {
		maxLen = len(parts2)
	}

	for i := 0; i < maxLen; i++ {
		var num1, num2 int
		if i < len(parts1) && parts1[i] != "" {
			num1, _ = strconv.Atoi(parts1[i])
		}
		if i < len(parts2) && parts2[i] != "" {
			num2, _ = strconv.Atoi(parts2[i])
		}

		if num1 != num2 {
			if num1 < num2 {
				return -1
			}
			return 1
		}
	}

	return 0
}
