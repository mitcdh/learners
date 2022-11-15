# Learners

Cyber Range Learners [Hugo](https://gohugo.io/) Theme

Based on [hugo-theme-learn](https://github.com/matcornic/hugo-theme-learn)

## Calculating Risk from Two Other Fields

*If you wish to calculate risk as a readonly field in a Learners form, here is how:*

Risk is calculated as (Likelihood * Impact), therefore two text inputs (`input-select` in the example below) are used to select the two values. These are then passed into the `input-risk` field, referenced by their labels. The `input-risk` field is `readonly`, this can be changed for local copies in `../layouts/shortcodes/input-risk.html`.

```
{{< input-select
    label="Likelihood"
    options="1 - Remote; 2 - Unlikely; 3 - Possible; 4 - Likely; 5 - Certain"
    required=true >}}
{{< input-select
    label="Impact"
    options="1 - Trivial; 2 - Minor; 3 - Moderate; 4 - Major; 5 - Critical"
    required=true >}}
{{< input-risk
    label="Risk as LxI"
    likelihood="Likelihood"
    impact="Impact"
    required=true
    default=0>}}
```

    