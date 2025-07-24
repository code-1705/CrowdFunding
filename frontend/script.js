import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm';

const contractAddress = "0x959BDDD1d3024cc29488cE80783c6BD647C70B8D";
const abi = [
    "function createCampaign(string,string,uint256,uint256) returns (uint256)",
    "function donate(uint256) payable",
    "function getCampaign(uint256) view returns (address,string,string,uint256,uint256,uint256,bool)",
    "function withdrawFunds(uint256 _id)"
];

let signer;
let contract;
let neccessary = 0;

function walletConnection() {
    return neccessary === 1;
}

document.getElementById("connect").onclick = async () => {
    if (!window.ethereum) return alert("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    contract = new ethers.Contract(contractAddress, abi, signer);
    document.getElementById("connect").textContent = "Connected";
    neccessary = 1;
    // alert("Wallet connected");
};

document.getElementById("create").onclick = async () => {
    if (!walletConnection()) { alert("Wallet not Connected"); }
    const title = document.getElementById("title").value;
    const desc = document.getElementById("description").value;
    const goal = ethers.parseEther(document.getElementById("goal").value);
    const duration = parseInt(document.getElementById("duration").value);

    const tx = await contract.createCampaign(title, desc, goal, duration);
    await tx.wait();
    alert("Campaign created");
};

document.getElementById("donate").onclick = async () => {
    if (!walletConnection()) { alert("Wallet not Connected"); }
    const id = parseInt(document.getElementById("campaignId").value);
    const amount = ethers.parseEther(document.getElementById("donationAmount").value);
    try {
        const tx = await contract.donate(id, { value: amount });
        await tx.wait();
        alert("Donation successful");
    }
    catch (error) {
        if (error.code === "INSUFFICIENT_FUNDS") {
            alert("Insufficient funds: You don't have enough ETH to cover the donation and gas fees.");
        }
        else {
            alert(error.message);
        }
        console.log(error);
    }
};

document.getElementById("getInfo").onclick = async () => {
    if (!walletConnection()) { alert("Wallet not Connected"); }
    const id = parseInt(document.getElementById("infoId").value);
    if (id < 0) {
        alert("Enter a valid Campaign ID");
    }
    const info = await contract.getCampaign(id);

    const deadline = new Date(Number(info[4]) * 1000);
    let deadline1 = deadline.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
    if (info[4] == 0) {
        deadline1 = null;
    }

    document.getElementById("infoOutput").innerHTML =
        `Owner Title : ${info[1]}
            <br><br>Description : ${info[2]}
            <br><br>Goal : ${ethers.formatEther(info[3])} ETH
            <br><br>Deadline : ${deadline1}
            <br><br>Amount Raised : ${ethers.formatEther(info[5])} ETH
            <br><br>Completed : ${info[6]}`
        ;
};

document.getElementById("withdraw").onclick = async () => {
    if (!walletConnection()) { alert("Wallet not Connected"); }
    const id = parseInt(document.getElementById("withdrawId").value);
    if (id < 0) {
        alert("Enter a valid Campaign ID");
    }
    try {
        const s = await contract.withdrawFunds(id);
        await s.wait();
        alert("Withdraw Successfull");
    }
    catch (error) {
        alert(error.message);
    }
}