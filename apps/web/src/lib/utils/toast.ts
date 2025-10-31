import { toast } from 'svelte-sonner';

export const showToast = {
	success: (message: string, options?: Parameters<typeof toast.success>[1]) => {
		toast.success(message, options);
	},

	error: (message: string, options?: Parameters<typeof toast.error>[1]) => {
		toast.error(message, options);
	},

	info: (message: string, options?: Parameters<typeof toast.info>[1]) => {
		toast.info(message, options);
	},

	warning: (message: string, options?: Parameters<typeof toast.warning>[1]) => {
		toast.warning(message, options);
	},

	custom: (message: string, options?: Parameters<typeof toast>[1]) => {
		toast(message, options);
	}
};
