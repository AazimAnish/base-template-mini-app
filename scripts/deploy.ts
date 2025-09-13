import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const SUSGameEscrow = await ethers.getContractFactory("SUSGameEscrow");
  const susGame = await SUSGameEscrow.deploy();

  await susGame.waitForDeployment();

  console.log("SUSGameEscrow deployed to:", await susGame.getAddress());
  
  // Save deployment info
  const deployment = {
    contractAddress: await susGame.getAddress(),
    deployerAddress: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  console.log("Deployment info:", deployment);
  
  return deployment;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});