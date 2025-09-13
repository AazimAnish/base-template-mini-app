"use client";

import { useState } from "react";
import { APP_NAME } from "~/lib/constants";
import sdk from "@farcaster/frame-sdk";
import { useMiniApp } from "@neynar/react";
import { useAccount, useDisconnect, useChainId } from "wagmi";
import { Button } from "~/components/ui/Button";
import { Copy, Check } from "lucide-react";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

export function Header({ neynarUser }: HeaderProps) {
  const { context } = useMiniApp();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [hasClickedPfp, setHasClickedPfp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 84532: return "Base Sepolia";
      case 8453: return "Base";
      case 1: return "Ethereum";
      case 10: return "Optimism";
      default: return `Chain ${chainId}`;
    }
  };

  return (
    <div className="relative">
      <div className="mb-1 py-2 px-3 bg-card text-card-foreground rounded-lg flex items-center justify-between border-[3px] border-double border-primary">
        <div className="text-lg font-light">Welcome to {APP_NAME}!</div>
        {context?.user && (
          <div
            className="cursor-pointer"
            onClick={() => {
              setIsUserDropdownOpen(!isUserDropdownOpen);
              setHasClickedPfp(true);
            }}
          >
            {context.user.pfpUrl && (
              <img
                src={context.user.pfpUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-primary"
              />
            )}
          </div>
        )}
      </div>
      {context?.user && (
        <>
          {!hasClickedPfp && (
            <div className="absolute right-0 -bottom-6 text-xs text-primary flex items-center justify-end gap-1 pr-2">
              <span className="text-[10px]">↑</span> Click PFP!{" "}
              <span className="text-[10px]">↑</span>
            </div>
          )}

          {isUserDropdownOpen && (
            <div className="absolute top-full right-0 z-50 w-fit mt-1 bg-card text-card-foreground rounded-lg shadow-lg border border-border">
              <div className="p-3 space-y-2">
                <div className="text-right">
                  <h3
                    className="font-bold text-sm hover:underline cursor-pointer inline-block text-foreground"
                    onClick={() =>
                      sdk.actions.viewProfile({ fid: context.user.fid })
                    }
                  >
                    {context.user.displayName || context.user.username}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    @{context.user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    FID: {context.user.fid}
                  </p>
                  {neynarUser && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Neynar Score: {neynarUser.score}
                      </p>
                    </>
                  )}
                </div>
                
                {/* Wallet disconnect section */}
                {isConnected && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-muted-foreground">
                        Network:
                      </div>
                      <div className="text-xs text-blue-400 font-medium">
                        {getNetworkName(chainId)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-muted-foreground">
                        Wallet:
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-mono text-foreground">
                          {address}
                        </span>
                        <button
                          onClick={handleCopyAddress}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title={copied ? "Copied!" : "Copy address"}
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        disconnect();
                        setIsUserDropdownOpen(false);
                      }}
                      variant="outline"
                      className="w-full text-xs py-1 px-2"
                    >
                      Disconnect Wallet
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
