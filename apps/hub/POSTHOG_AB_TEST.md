# Landing copy A/B test

The landing page reads the PostHog multivariate feature flag `landing-page-copy`.

## Variants

- `control`: current landing page copy
- `make-money`: creator revenue and business-use copy

## PostHog setup

1. Create a multivariate feature flag named `landing-page-copy`.
2. Add variants named exactly `control` and `make-money`.
3. Split traffic 50/50 and target the production landing page audience.
4. Create an experiment using that feature flag.
5. Set the experiment goal event to `pricing_buy_clicked`.
6. Use `landing_copy_variant` as a breakdown when auditing events.

The goal event fires when a visitor clicks a pricing card or its buy button, before
the checkout integration starts. It includes `plan`, `price`, `source`, and
`landing_copy_variant`.

Supporting events:

- `landing_copy_experiment_viewed`
- `clicked_get_rpwallet`
- `checkout_started`
