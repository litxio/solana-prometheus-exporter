{
  description = "Solana";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }: {

    packages.x86_64-linux.solana-prometheus-exporter =
      let pkgs = import nixpkgs { system = "x86_64-linux"; };
      in pkgs.buildGoModule {
        name = "solana_exporter";
        src = pkgs.fetchFromGitHub {
          owner = "certusone";
          repo = "solana_exporter";
          rev = "4db1d1ba23ca16b323684edf21ea69d8afe04adf";
          sha256 = "sha256-bo/wOoV1bJnpGmrNomAefSaB+hOYZ/QyyQngzV0pQak=";
        };
        vendorSha256 = "sha256-wTb7aH9/9C413XanAvDXKIrPEBGp+VEfXcURQUeRTis=";
      };

    defaultPackage.x86_64-linux = self.packages.x86_64-linux.solana-prometheus-exporter;

  };
}
