{lib, mkYarnPackage, nodePackages}:

# Note that any attrs not picked up by mkYarnPackage are sent to mkDerivation
# so we can add additional phases, as we do with typescriptCompilePhase.
mkYarnPackage rec {
  name = "solana-prometheus-exporter";
  src = lib.cleanSource ./.;
  packageJSON = ./package.json;
  yarnLock = ./yarn.lock;
  yarnNix = ./yarn.nix;
  typescriptCompilePhase = ''
    yarn --offline build
    pwd
    ls
    chmod +x deps/${name}/bin/app.js
  '';
  preBuildPhases = ["typescriptCompilePhase"];
}
