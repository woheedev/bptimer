<script lang="ts">
	import { page } from '$app/state';
	import ErrorBoundary from '$lib/components/error-boundary.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Shield } from '@lucide/svelte/icons';

	const canonicalUrl = `https://bptimer.com${page.url.pathname}`;
</script>

<SeoHead
	title="Privacy Policy | BP Timer"
	description="Learn how BP Timer handles data, analytics, cookies, and advertising for Blue Protocol: Star Resonance players."
	keywords="bp timer privacy, blue protocol privacy policy, bpsr privacy, data usage, cookies"
	{canonicalUrl}
/>

<svelte:boundary>
	<Sidebar.Provider>
		<NavigationSidebar />
		<Sidebar.Inset>
			<NavigationHeader />
			<div class="container mx-auto space-y-6 p-4">
				<PageHeader
					icon={Shield}
					title="Privacy Policy"
					subtitle="How BP Timer handles your data"
				/>

				<div class="space-y-6 text-sm leading-relaxed text-muted-foreground">
					<section>
						<h2 class="text-base font-semibold text-foreground">Overview</h2>
						<p>
							BP Timer is a community tool for Blue Protocol: Star Resonance. This page explains
							what limited data is collected, how it is used, and your options.
						</p>
					</section>

					<section>
						<h2 class="text-base font-semibold text-foreground">Analytics</h2>
						<p>
							We use privacy-friendly analytics (Umami) and Google Analytics to understand how the
							site is used. Data is aggregated and does not include any game data or credentials. It
							typically covers page views, browser details, approximate region and referrers, which
							helps us prioritize features and monitor performance.
						</p>
					</section>

					<section>
						<h2 class="text-base font-semibold text-foreground">Cookies & Local Storage</h2>
						<p>
							BP Timer uses browser local storage to remember your preferences (such as region,
							filters, and module optimizer settings). You can clear these at any time in your
							browser settings. Clearing them will reset your local preferences on this site.
						</p>
					</section>

					<section>
						<h2 class="text-base font-semibold text-foreground">Advertising</h2>
						<p>
							Ads are served through Mediavine and its third-party partners. They may use cookies or
							similar technologies to deliver and measure advertising. You can control ad-related
							cookies via your browser or system-level privacy settings (including ad blockers).
						</p>
					</section>

					<section>
						<h2 class="text-base font-semibold text-foreground">Discord</h2>
						<p>
							BP Timer supports logging in with Discord solely for authentication so you can submit
							manual reports and related game data. Basic Discord details (such as your Discord
							username, email, and avatar) may be received during login but are not sold or shared
							with third parties and are not used beyond authentication and abuse prevention.
						</p>
					</section>

					<section>
						<h2 class="text-base font-semibold text-foreground">Game Data</h2>
						<p>
							BP Timer receives game-related data from community tools such as DPS meters and other
							integrations. Please refer to each tool&apos;s own privacy policy for full details.
							Reports sent to BP Timer from these tools contain non-sensitive game data such as mob
							details, line number, server region, and user ID. This data is used solely to power
							mob timers and real-time data displays.
						</p>
					</section>

					<section>
						<h2 class="text-base font-semibold text-foreground">Data Retention</h2>
						<p>
							Server-side data such as boss reports, votes, and API usage logs are retained only as
							long as necessary to operate the service, debug issues, and prevent abuse.
						</p>
					</section>

					<section>
						<h2 class="text-base font-semibold text-foreground">Contact</h2>
						<p>
							If you have questions or privacy-related requests, you can reach out via the BP Timer
							Discord server linked in the sidebar.
						</p>
					</section>
				</div>
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>

	{#snippet failed(error, reset)}
		<ErrorBoundary {error} {reset} />
	{/snippet}
</svelte:boundary>
