{
  description = "Renu";
  nixConfig.bash-prompt = "\[nix:renu\]$ ";

  inputs = {
    nixpkgs = {
      url = "github:nixos/nixpkgs/nixpkgs-unstable";
    };

    flake-utils = {
      url = "github:numtide/flake-utils";
    };
  };

  outputs = {
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      formatter = pkgs.alejandra;

      devShells = {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs-18_x
            nodePackages.pm2
          ];
          shellHook = ''
            mkdir -p $out/bin
            ${pkgs.nodejs-18_x}/bin/corepack enable --install-directory $out/bin
            export PATH="$out/bin:$PATH"
          '';
        };
      };
    });
}
