{
  description = "Solana";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }: rec {

    packages.x86_64-linux.solana-prometheus-exporter =
      let pkgs = import nixpkgs { system = "x86_64-linux"; };
      in pkgs.callPackage ./default.nix {};
    defaultPackage.x86_64-linux = self.packages.x86_64-linux.solana-prometheus-exporter;

    nixosModules.solana-prometheus-exporter = import ./module.nix;
    nixosModules.default = nixosModules.solana-prometheus-exporter;

    overlays.solana-prometheus-exporter = final: prev: {
      solana-prometheus-exporter = defaultPackage.x86_64-linux;
    };
    overlays.default = overlays.solana-prometheus-exporter;
  };
}
