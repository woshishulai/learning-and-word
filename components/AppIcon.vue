<template>
	<image
		:src="'/static/icons/' + name + '.svg'"
		:style="{ width: size + 'px', height: size + 'px' }"
		mode="aspectFit"
		aria-hidden="true"
	/>
</template>
<script>
export default {
	props: {
		name: { type: String, default: "arrow" },
		size: { type: Number, default: 20 },
	},
};
</script>
