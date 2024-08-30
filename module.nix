{ lib, pkgs, config, ... }:
with lib;
let
  cfg = config.services.solana-prometheus-exporter;
in {
  options.services.solana-prometheus-exporter = {
    enable = mkEnableOption "Enable Solana Prometheus exporter";
    listenPort = mkOption {
      type = types.int;
      default = 9621;
    };
    metricFreq = mkOption {
      type = types.int;
      default = 60;
    };
    localUri = mkOption {
      type = types.str;
      default = "http://127.0.0.1:8899";
    };
    referenceRpcUris = mkOption {
      type = types.listOf types.str;
      default = ["https://api.mainnet-beta.solana.com"];
    };
    validatorIdentity = mkOption {
      type = types.str;
      default = "";
    };
    onlyOwnDetails = mkOption {
      type = types.bool;
      default = true;
    };
    solanaBinaryPath = mkOption {
      type = types.str;
      default = "${pkgs.solana-cli}/bin/solana";
    };
  };

  config = mkIf cfg.enable {
    systemd.services.solana-prometheus-exporter = {
      wantedBy = [ "multi-user.target" ];
      serviceConfig.Environment =
        let refUris = builtins.concatStringsSep "," cfg.referenceRpcUris;
            env = builtins.concatStringsSep " " [
              "LISTEN_PORT=${toString cfg.listenPort}"
              "METRIC_FREQUENCY=${toString cfg.metricFreq}"
              "LOCAL_RPC_URI=${cfg.localUri}"
              "REFERENCE_RPC_URIS=${refUris}"
              "VALIDATOR_IDENTITY=${cfg.validatorIdentity}"
              "SOLANA_BINARY_PATH=${cfg.solanaBinaryPath}"
              (if cfg.onlyOwnDetails then "ONLY_OWN_DETAILS=1" else "")
            ];
        in env;
      serviceConfig.ExecStart =
        "${pkgs.solana-prometheus-exporter}/bin/solana-prometheus-exporter";
    };
  };
}
