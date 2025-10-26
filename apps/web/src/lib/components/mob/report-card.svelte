<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { formatTimeAgo, getInitials } from '$lib/utils/general-utils';
	import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';

	let {
		report
	}: {
		report: {
			channel: number;
			hp_percentage: number;
			user: {
				name: string;
				avatar?: string;
			};
			create_time: string;
		};
	} = $props();

	// Get user initials for avatar fallback
	let user_initials = $derived(getInitials(report.user.name));
</script>

<div class="shrink-0 rounded-lg border p-3">
	<div class="flex items-start justify-between gap-2">
		<!-- Left side: Avatar + Info -->
		<div class="flex min-w-0 flex-1 items-center space-x-2">
			<Avatar.Root class="h-8 w-8 shrink-0">
				<Avatar.Image src={report.user.avatar} alt={report.user.name} />
				<Avatar.Fallback class="text-sm">
					{user_initials}
				</Avatar.Fallback>
			</Avatar.Root>
			<div class="min-w-0 flex-1">
				<p class="text-muted-foreground truncate text-sm font-medium">
					Ch {report.channel} • {report.hp_percentage}% HP
				</p>
				<p class="truncate text-xs">{report.user.name}</p>
			</div>
		</div>

		<!-- Right side: Vote buttons -->
		<div class="flex shrink-0 items-center gap-1">
			<Tooltip.Root>
				<Tooltip.Trigger>
					<button
						class="hover:bg-accent rounded-md p-1 transition-colors"
						aria-label="Upvote"
						onclick={() => {
							/* TODO: Implement upvote */
						}}
					>
						<ThumbsUpIcon class="h-4 w-4" />
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>Coming Soon</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<button
						class="hover:bg-accent rounded-md p-1 transition-colors"
						aria-label="Downvote"
						onclick={() => {
							/* TODO: Implement downvote */
						}}
					>
						<ThumbsDownIcon class="h-4 w-4" />
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>Coming Soon</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>

	<!-- Bottom: Timestamp -->
	<div class="mt-2 flex justify-end">
		<p class="text-muted-foreground text-xs">
			{formatTimeAgo(report.create_time)}
		</p>
	</div>
</div>
