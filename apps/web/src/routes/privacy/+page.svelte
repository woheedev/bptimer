<script lang="ts">
	import { page } from '$app/state';
	import ErrorBoundary from '$lib/components/error-boundary.svelte';
	import NavigationHeader from '$lib/components/navigation/header.svelte';
	import NavigationSidebar from '$lib/components/navigation/sidebar.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Shield } from '@lucide/svelte/icons';

	const canonicalUrl = `${page.url.origin}${page.url.pathname}`;
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

					<section class="space-y-3">
						<h3 class="text-base font-semibold text-foreground">
							Mediavine Programmatic Advertising (Ver 1.1)
						</h3>
						<p>
							The Website works with Mediavine to manage third-party interest-based advertising
							appearing on the Website. Mediavine serves content and advertisements when you visit
							the Website, which may use first and third-party cookies. A cookie is a small text
							file which is sent to your computer or mobile device (referred to in this policy as a
							"device") by the web server so that a website can remember some information about your
							browsing activity on the Website.
						</p>
						<p>
							First party cookies are created by the website that you are visiting. A third-party
							cookie is frequently used in behavioral advertising and analytics and is created by a
							domain other than the website you are visiting. Third-party cookies, tags, pixels,
							beacons and other similar technologies (collectively, "Tags") may be placed on the
							Website to monitor interaction with advertising content and to target and optimize
							advertising. Each internet browser has functionality so that you can block both first
							and third-party cookies and clear your browser's cache. The "help" feature of the menu
							bar on most browsers will tell you how to stop accepting new cookies, how to receive
							notification of new cookies, how to disable existing cookies and how to clear your
							browser's cache. For more information about cookies and how to disable them, you can
							consult the information at
							<a
								href="https://www.allaboutcookies.org/manage-cookies/"
								target="_blank"
								rel="noreferrer noopener nofollow"
								class="underline hover:text-foreground">All About Cookies</a
							>.
						</p>
						<p>
							Without cookies you may not be able to take full advantage of the Website content and
							features. Please note that rejecting cookies does not mean that you will no longer see
							ads when you visit our Site. In the event you opt-out, you will still see
							non-personalized advertisements on the Website.
						</p>
						<p>
							The Website collects the following data using a cookie when serving personalized ads:
						</p>
						<ul class="list-inside list-disc space-y-1 pl-2">
							<li>IP Address</li>
							<li>Operating System type</li>
							<li>Operating System version</li>
							<li>Device Type</li>
							<li>Language of the website</li>
							<li>Web browser type</li>
							<li>Email (in hashed form)</li>
						</ul>
						<p>
							Mediavine Partners (companies listed below with whom Mediavine shares data) may also
							use this data to link to other end user information the partner has independently
							collected to deliver targeted advertisements. Mediavine Partners may also separately
							collect data about end users from other sources, such as advertising IDs or pixels,
							and link that data to data collected from Mediavine publishers in order to provide
							interest-based advertising across your online experience, including devices, browsers
							and apps. This data includes usage data, cookie information, device information,
							information about interactions between users and advertisements and websites,
							geolocation data, traffic data, and information about a visitor's referral source to a
							particular website. Mediavine Partners may also create unique IDs to create audience
							segments, which are used to provide targeted advertising.
						</p>
						<p>
							If you would like more information about this practice and to know your choices to
							opt-in or opt-out of this data collection, please visit
							<a
								href="https://thenai.org/opt-out/"
								target="_blank"
								rel="noreferrer noopener nofollow"
								class="underline hover:text-foreground"
								>National Advertising Initiative opt out page</a
							>. You may also visit
							<a
								href="http://optout.aboutads.info/#/"
								target="_blank"
								rel="noreferrer noopener nofollow"
								class="underline hover:text-foreground">Digital Advertising Alliance website</a
							>
							and
							<a
								href="http://optout.networkadvertising.org/#"
								target="_blank"
								rel="noreferrer noopener nofollow"
								class="underline hover:text-foreground">Network Advertising Initiative website</a
							>
							to learn more information about interest-based advertising. You may download the AppChoices
							app at
							<a
								href="https://youradchoices.com/appchoices"
								target="_blank"
								rel="noreferrer noopener nofollow"
								class="underline hover:text-foreground"
								>Digital Advertising Alliance's AppChoices app</a
							>
							to opt out in connection with mobile apps, or use the platform controls on your mobile device
							to opt out.
						</p>
						<p>
							For specific information about Mediavine Partners, the data each collects and their
							data collection and privacy policies, please visit
							<a
								href="https://www.mediavine.com/ad-partners/"
								target="_blank"
								rel="noreferrer noopener nofollow"
								class="underline hover:text-foreground">Mediavine Partners</a
							>.
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
							If you have questions or privacy-related requests, you can reach out via the BPSR Devs
							Discord server linked in the resources page.
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
