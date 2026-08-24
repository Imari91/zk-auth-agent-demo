#Compiles both circuit variants into isolated, disposable output folders
#(never touches artifacts_v3/, which holds the real trusted setup) and
#prints a constraint-count delta table.

$ErrorActionPreference = "Stop"

$OUT_NEW = "artifacts_compare_new"
$OUT_OLD = "artifacts_compare_old"

New-Item -ItemType Directory -Force -Path $OUT_NEW | Out-Null
New-Item -ItemType Directory -Force -Path $OUT_OLD | Out-Null

Write-Host "Compiling current circuit (zk_auth_policy_v3.circom)..."
circom zk_auth_policy_v3.circom --r1cs -o $OUT_NEW -l node_modules

Write-Host "Compiling legacy circuit (zk_auth_policy_v3single.circom)..."
circom zk_auth_policy_v3single.circom --r1cs -o $OUT_OLD -l node_modules

function Get-CircuitStats($r1csPath) {
    $output = snarkjs.cmd r1cs info $r1csPath 2>&1 | Out-String
    $parse = {
        param($label)
        if ($output -match "# of $label\D*(\d+)") { return [int]$matches[1] }
        return $null
    }
    [PSCustomObject]@{
        Constraints   = & $parse "Constraints"
        Wires         = & $parse "Wires"
        PrivateInputs = & $parse "Private Inputs"
        PublicInputs  = & $parse "Public Inputs"
        Outputs       = & $parse "Outputs"
    }
}

$new = Get-CircuitStats "$OUT_NEW\zk_auth_policy_v3.r1cs"
$old = Get-CircuitStats "$OUT_OLD\zk_auth_policy_v3single.r1cs"

$delta = [PSCustomObject]@{
    Metric        = "Delta (new - old)"
    Constraints   = $new.Constraints - $old.Constraints
    Wires         = $new.Wires - $old.Wires
    PrivateInputs = $new.PrivateInputs - $old.PrivateInputs
    PublicInputs  = $new.PublicInputs - $old.PublicInputs
    Outputs       = $new.Outputs - $old.Outputs
}

Write-Host "`n=== zk_auth_policy_v3.circom (Poseidon(2), current) ==="
$new | Format-Table

Write-Host "=== zk_auth_policy_v3single.circom (Poseidon(1), legacy) ==="
$old | Format-Table

Write-Host "=== Delta ==="
$delta | Format-Table