// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { FHE, euint32, euint64, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title SecretNFTLaunchFHE
 * @dev A confidential NFT launch platform using FHEVM for true privacy
 */
contract SecretNFTLaunchFHE is Ownable, ReentrancyGuard, SepoliaConfig {
    constructor() Ownable(msg.sender) {}
    using SafeERC20 for IERC20;

    // Error definitions
    error LaunchNotActive();
    error LaunchEnded();
    error LaunchNotEnded();
    error InvalidAmount();
    error AlreadyParticipated();
    error NotEnoughTokens();
    error LaunchNotFinalized();
    error AlreadyFinalized();
    error InvalidTokenAddress();
    error InvalidPrice();

    // Events
    event LaunchCreated(
        uint256 indexed launchId,
        address indexed nftContract,
        uint256 totalSupply,
        uint256 startTime,
        uint256 endTime
    );
    event SecretPurchase(
        uint256 indexed launchId,
        address indexed buyer
    );
    event LaunchFinalized(uint256 indexed launchId);
    event TokensClaimed(
        uint256 indexed launchId,
        address indexed buyer,
        uint256 amount
    );

    // Launch structure with FHE variables
    struct Launch {
        address nftContract;           // NFT contract address
        uint256 totalSupply;           // Total supply
        uint256 startTime;             // Start time
        uint256 endTime;               // End time
        euint32 secretPrice;           // Encrypted confidential price
        euint64 totalRaised;           // Encrypted total raised
        euint64 totalSold;             // Encrypted total sold
        bool isActive;                 // Whether active
        bool isFinalized;              // Whether finalized
        address paymentToken;          // Payment token address
    }

    // User participation record with FHE variables
    struct UserParticipation {
        euint64 amountPaid;            // Encrypted payment amount
        euint32 tokensBought;          // Encrypted purchase amount
        bool hasClaimed;               // Whether claimed
    }

    // State variables
    uint256 public nextLaunchId = 0;
    uint256 public platformFee = 250; // 2.5% fee (250 basis points)
    
    // Mappings
    mapping(uint256 => Launch) public launches;
    mapping(uint256 => mapping(address => UserParticipation)) public participations;
    mapping(uint256 => address[]) public participants;
    mapping(address => address) public nftCollectionCreators; // NFT Collection address => creator address



    /**
     * @dev Register NFT Collection creator
     */
    function registerNFTCollectionCreator(
        address _nftContract,
        address _creator
    ) external {
        if (_nftContract == address(0)) revert InvalidTokenAddress();
        if (_creator == address(0)) revert InvalidTokenAddress();
        
        nftCollectionCreators[_nftContract] = _creator;
    }

    /**
     * @dev Create a new NFT launch with encrypted price
     */
    function createLaunch(
        address _nftContract,
        uint256 _totalSupply,
        uint256 _startTime,
        uint256 _endTime,
        externalEuint32 _encryptedPrice,
        bytes calldata _inputProof,
        address _paymentToken
    ) external {
        if (_nftContract == address(0)) revert InvalidTokenAddress();
        if (_startTime >= _endTime) revert InvalidPrice();
        if (_totalSupply == 0) revert InvalidAmount();
        
        // Check if caller is the creator of the NFT Collection or the contract owner
        address creator = nftCollectionCreators[_nftContract];
        if (creator == address(0)) {
            if (msg.sender != owner()) revert InvalidTokenAddress();
        } else {
            if (msg.sender != creator && msg.sender != owner()) revert InvalidTokenAddress();
        }

        // Convert externalEuint32 to euint32 using FHE.fromExternal
        euint32 secretPrice = FHE.fromExternal(_encryptedPrice, _inputProof);

        uint256 launchId = nextLaunchId++;
        
        Launch storage launch = launches[launchId];
        launch.nftContract = _nftContract;
        launch.totalSupply = _totalSupply;
        launch.startTime = _startTime;
        launch.endTime = _endTime;
        launch.secretPrice = secretPrice;
        launch.paymentToken = _paymentToken;
        launch.isActive = true;
        launch.totalRaised = FHE.asEuint64(0);
        launch.totalSold = FHE.asEuint64(0);

        // Grant FHE permissions
        FHE.allowThis(secretPrice);
        FHE.allow(secretPrice, msg.sender);

        emit LaunchCreated(launchId, _nftContract, _totalSupply, _startTime, _endTime);
    }

    /**
     * @dev Confidential purchase of NFT using FHE
     */
    function secretPurchase(
        uint256 _launchId,
        externalEuint32 _encryptedAmount,
        bytes calldata _inputProof
    ) external nonReentrant payable {
        Launch storage launch = launches[_launchId];
        if (!launch.isActive) revert LaunchNotActive();
        if (block.timestamp < launch.startTime || block.timestamp > launch.endTime) revert LaunchEnded();

        UserParticipation storage participation = participations[_launchId][msg.sender];
        if (participation.hasClaimed) revert AlreadyParticipated();

        // Convert externalEuint32 to euint32 using FHE.fromExternal
        euint32 amount = FHE.fromExternal(_encryptedAmount, _inputProof);
        
        // Calculate payment amount using FHE operations
        euint64 amountPaid = FHE.asEuint64(0);
        
        // Update user participation record using FHE operations
        participation.amountPaid = FHE.add(participation.amountPaid, amountPaid);
        participation.tokensBought = FHE.add(participation.tokensBought, amount);

        // Update launch statistics using FHE operations
        launch.totalRaised = FHE.add(launch.totalRaised, amountPaid);
        launch.totalSold = FHE.add(launch.totalSold, amount);

        // Grant FHE permissions
        FHE.allowThis(participation.amountPaid);
        FHE.allow(participation.amountPaid, msg.sender);
        FHE.allowThis(participation.tokensBought);
        FHE.allow(participation.tokensBought, msg.sender);
        FHE.allowThis(launch.totalRaised);
        FHE.allowThis(launch.totalSold);

        // Record participant
        if (participants[_launchId].length == 0 || 
            participants[_launchId][participants[_launchId].length - 1] != msg.sender) {
            participants[_launchId].push(msg.sender);
        }

        emit SecretPurchase(_launchId, msg.sender);
    }

    /**
     * @dev Finalize a launch
     */
    function finalizeLaunch(uint256 _launchId) external onlyOwner {
        Launch storage launch = launches[_launchId];
        if (!launch.isActive) revert LaunchNotActive();
        if (block.timestamp <= launch.endTime) revert LaunchNotEnded();
        if (launch.isFinalized) revert AlreadyFinalized();

        launch.isFinalized = true;
        launch.isActive = false;

        emit LaunchFinalized(_launchId);
    }

    /**
     * @dev Claim NFTs after launch finalization
     */
    function claimNFTs(uint256 _launchId) external nonReentrant {
        Launch storage launch = launches[_launchId];
        if (!launch.isFinalized) revert LaunchNotFinalized();

        UserParticipation storage participation = participations[_launchId][msg.sender];
        if (participation.hasClaimed) revert AlreadyParticipated();

        // For demo purposes, we just emit the event
        // In production, this would mint NFTs to the user
        uint256 tokensToClaim = 1; // Simplified for demo
        participation.hasClaimed = true;

        emit TokensClaimed(_launchId, msg.sender, tokensToClaim);
    }

    /**
     * @dev Get launch information (public data only)
     */
    function getLaunch(uint256 _launchId) external view returns (
        address nftContract,
        uint256 totalSupply,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool isFinalized,
        address paymentToken
    ) {
        Launch storage launch = launches[_launchId];
        return (
            launch.nftContract,
            launch.totalSupply,
            launch.startTime,
            launch.endTime,
            launch.isActive,
            launch.isFinalized,
            launch.paymentToken
        );
    }

    /**
     * @dev Get all participants for a launch
     */
    function getParticipants(uint256 _launchId) external view returns (address[] memory) {
        return participants[_launchId];
    }

    /**
     * @dev Set platform fee (owner only)
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        platformFee = _fee;
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            require(success, "Transfer failed");
        }
    }

    // Receive function to accept ETH
    receive() external payable {}
}
