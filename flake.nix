{
  description = "Renu";
  nixConfig.bash-prompt = "\[nix:renu\]$ ";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = {nixpkgs, ...}: let
    # Helper generating outputs for each desired system
    forAllSystems = nixpkgs.lib.genAttrs [
      "x86_64-darwin"
      "x86_64-linux"
      "aarch64-darwin"
      "aarch64-linux"
    ];

    # Import nixpkgs' package set for each system.
    nixpkgsFor = forAllSystems (system:
      import nixpkgs {
        inherit system;
      });

    formatter = forAllSystems (system: nixpkgsFor.${system}.alejandra);
    devShells = forAllSystems (
      system: let
        pkgs = nixpkgsFor.${system};
      in {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs-18_x
            nodePackages.pnpm
          ];
        };
      }
    );
  in {
    inherit formatter devShells;
  };
}
