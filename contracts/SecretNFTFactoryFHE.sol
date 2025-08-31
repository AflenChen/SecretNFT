// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SecretNFTFHE} from "./SecretNFTFHE.sol";
import {SecretNFTLaunchFHE} from "./SecretNFTLaunchFHE.sol";

/**
 * @title SecretNFTFactoryFHE
 * @dev Factory contract for creating confidential NFT collections using FHEVM
 */
contract SecretNFTFactoryFHE is Ownable {
    // Error definitions
    error InvalidName();
    error InvalidSymbol();
    error InvalidBaseURI();
    error CollectionCreationFailed();

    // Events
    event NFTCollectionCreated(
        address indexed collectionAddress,
        address indexed creator,
        string name,
        string symbol,
        string baseURI
    );

    // State variables
    address public launchContractAddress;
    mapping(address => address[]) public userCollections; // User address => array of collection addresses
    address[] public allCollections;

    // Interface for SecretNFTLaunchFHE
    interface ISecretNFTLaunchFHE {
        function registerNFTCollectionCreator(address _nftContract, address _creator) external;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Set the launch contract address
     * @param _launchContractAddress Address of the SecretNFTLaunchFHE contract
     */
    function setLaunchContractAddress(address _launchContractAddress) external onlyOwner {
        launchContractAddress = _launchContractAddress;
    }

    /**
     * @dev Create a new confidential NFT collection
     * @param name Collection name
     * @param symbol Collection symbol
     * @param baseURI Base URI for token metadata
     * @param maxSupply Maximum supply of NFTs
     */
    function createNFTCollection(
        string memory name,
        string memory symbol,
        string memory baseURI,
        uint256 maxSupply
    ) external payable returns (address) {
        if (bytes(name).length == 0) revert InvalidName();
        if (bytes(symbol).length == 0) revert InvalidSymbol();
        if (bytes(baseURI).length == 0) revert InvalidBaseURI();

        // Create new SecretNFTFHE contract
        SecretNFTFHE collection = new SecretNFTFHE(name, symbol);
        address collectionAddress = address(collection);

        // Transfer ownership to the creator
        collection.transferOwnership(msg.sender);

        // Register the collection creator with the launch contract
        if (launchContractAddress != address(0)) {
            try ISecretNFTLaunchFHE(launchContractAddress).registerNFTCollectionCreator(
                collectionAddress,
                msg.sender
            ) {
                // Registration successful
            } catch {
                // Registration failed, but collection creation should still succeed
                // This prevents the entire transaction from reverting
            }
        }

        // Record the collection
        userCollections[msg.sender].push(collectionAddress);
        allCollections.push(collectionAddress);

        emit NFTCollectionCreated(collectionAddress, msg.sender, name, symbol, baseURI);

        return collectionAddress;
    }

    /**
     * @dev Create a new confidential NFT collection with initial confidential metadata
     * @param name Collection name
     * @param symbol Collection symbol
     * @param baseURI Base URI for token metadata
     * @param maxSupply Maximum supply of NFTs
     * @param initialTokenId Initial token ID to mint
     * @param initialPublicURI Initial public metadata URI
     * @param initialEncryptedMetadata Initial encrypted confidential metadata
     */
    function createNFTCollectionWithInitialMint(
        string memory name,
        string memory symbol,
        string memory baseURI,
        uint256 maxSupply,
        uint256 initialTokenId,
        string memory initialPublicURI,
        bytes calldata initialEncryptedMetadata
    ) external payable returns (address) {
        if (bytes(name).length == 0) revert InvalidName();
        if (bytes(symbol).length == 0) revert InvalidSymbol();
        if (bytes(baseURI).length == 0) revert InvalidBaseURI();

        // Create new SecretNFTFHE contract
        SecretNFTFHE collection = new SecretNFTFHE(name, symbol);
        address collectionAddress = address(collection);

        // Mint initial NFT with confidential metadata
        collection.mintWithConfidentialMetadata(
            msg.sender,
            initialTokenId,
            initialPublicURI,
            initialEncryptedMetadata
        );

        // Transfer ownership to the creator
        collection.transferOwnership(msg.sender);

        // Register the collection creator with the launch contract
        if (launchContractAddress != address(0)) {
            try ISecretNFTLaunchFHE(launchContractAddress).registerNFTCollectionCreator(
                collectionAddress,
                msg.sender
            ) {
                // Registration successful
            } catch {
                // Registration failed, but collection creation should still succeed
            }
        }

        // Record the collection
        userCollections[msg.sender].push(collectionAddress);
        allCollections.push(collectionAddress);

        emit NFTCollectionCreated(collectionAddress, msg.sender, name, symbol, baseURI);

        return collectionAddress;
    }

    /**
     * @dev Get all collections created by a user
     * @param user User address
     */
    function getUserCollections(address user) external view returns (address[] memory) {
        return userCollections[user];
    }

    /**
     * @dev Get all collections
     */
    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    /**
     * @dev Get collection count
     */
    function getCollectionCount() external view returns (uint256) {
        return allCollections.length;
    }

    /**
     * @dev Get collection at index
     * @param index Collection index
     */
    function getCollectionAtIndex(uint256 index) external view returns (address) {
        require(index < allCollections.length, "Index out of bounds");
        return allCollections[index];
    }

    /**
     * @dev Check if address is a collection created by this factory
     * @param collectionAddress Collection address to check
     */
    function isCollection(address collectionAddress) external view returns (bool) {
        for (uint256 i = 0; i < allCollections.length; i++) {
            if (allCollections[i] == collectionAddress) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get collection creator
     * @param collectionAddress Collection address
     */
    function getCollectionCreator(address collectionAddress) external view returns (address) {
        for (uint256 i = 0; i < allCollections.length; i++) {
            if (allCollections[i] == collectionAddress) {
                // Find the user who created this collection
                for (uint256 j = 0; j < userCollections[msg.sender].length; j++) {
                    if (userCollections[msg.sender][j] == collectionAddress) {
                        return msg.sender;
                    }
                }
            }
        }
        return address(0);
    }

    /**
     * @dev Withdraw any ETH sent to this contract (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            require(success, "Transfer failed");
        }
    }
}
