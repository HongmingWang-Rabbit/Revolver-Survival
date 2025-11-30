<script lang="ts">
	import { balance } from '$lib/stores/gameStore';
</script>

<header class="header">
	<div class="balance-chip">
		<span class="balance-label">BALANCE</span>
		<span class="balance-amount">${$balance.toFixed(2)}</span>
	</div>
</header>

<style>
	.header {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		padding: 0.75rem 1.5rem;
	}

	.balance-chip {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		padding: 0.5rem 1rem;
		background: var(--color-bg-secondary);
		border-radius: 8px;
		border: 1px solid var(--color-bg-tertiary);
	}

	.balance-label {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
	}

	.balance-amount {
		font-size: 1.125rem;
		font-weight: bold;
		color: var(--color-gold);
	}

	@media (max-width: 480px) {
		.header {
			padding: 0.5rem 0.75rem;
		}

		.balance-chip {
			padding: 0.375rem 0.75rem;
		}

		.balance-label {
			font-size: 0.5rem;
		}

		.balance-amount {
			font-size: 1rem;
		}
	}
</style>
