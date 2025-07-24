// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CrowdFunding {
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        address[] donors;
        uint256[] donations;
        bool completed;
    }

    uint256 public campaignCount = 0;
    mapping(uint256 => Campaign) public campaigns;

    event CampaignCreated(
        uint256 indexed id,
        address indexed owner,
        string title,
        uint256 goal,
        uint256 deadline
    );
    event DonationReceived(
        uint256 indexed id,
        address indexed donor,
        uint256 amount
    );
    event CampaignCompleted(uint256 indexed id, uint256 totalRaised);

    modifier onlyOwner(uint256 _id) {
        require(msg.sender == campaigns[_id].owner, "Not campaign owner");
        _;
    }

    modifier beforeDeadline(uint256 _id) {
        require(block.timestamp < campaigns[_id].deadline, "Deadline passed");
        _;
    }

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _durationInDays
    ) external returns (uint256) {
        require(_goal > 0, "Goal must be positive");

        Campaign storage c = campaigns[campaignCount];
        c.owner = msg.sender;
        c.title = _title;
        c.description = _description;
        c.goal = _goal;
        c.deadline = block.timestamp + (_durationInDays * 1 days);
        c.completed = false;

        emit CampaignCreated(
            campaignCount,
            msg.sender,
            _title,
            _goal,
            c.deadline
        );
        campaignCount++;
        return campaignCount - 1;
    }

    function donate(uint256 _id) external payable beforeDeadline(_id) {
        require(msg.value > 0, "Donation must be positive");

        Campaign storage c = campaigns[_id];
        c.donors.push(msg.sender);
        c.donations.push(msg.value);
        c.amountRaised += msg.value;

        emit DonationReceived(_id, msg.sender, msg.value);
    }

    function withdrawFunds(uint256 _id) external onlyOwner(_id) {
        Campaign storage c = campaigns[_id];
        require(block.timestamp >= c.deadline, "Campaign still active");
        require(!c.completed, "Already withdrawn");

        c.completed = true;
        payable(c.owner).transfer(c.amountRaised);

        emit CampaignCompleted(_id, c.amountRaised);
    }

    function getDonors(
        uint256 _id
    ) external view returns (address[] memory, uint256[] memory) {
        return (campaigns[_id].donors, campaigns[_id].donations);
    }

    function getCampaign(
        uint256 _id
    )
        external
        view
        returns (
            address,
            string memory,
            string memory,
            uint256,
            uint256,
            uint256,
            bool
        )
    {
        Campaign storage c = campaigns[_id];
        return (
            c.owner,
            c.title,
            c.description,
            c.goal,
            c.deadline,
            c.amountRaised,
            c.completed
        );
    }
}
