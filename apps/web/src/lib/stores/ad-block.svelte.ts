let adBlocked = $state(false);

export const adBlockStore = {
	get value() {
		return adBlocked;
	},
	set value(v: boolean) {
		adBlocked = v;
	}
};
