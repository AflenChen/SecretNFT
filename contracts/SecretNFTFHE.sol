// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import { FHE, euint32, euint64, externalEuint32, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title SecretNFTFHE
 * @dev An ERC721 NFT contract with FHE capabilities for confidential metadata
 */
contract SecretNFTFHE is ERC721, ERC721URIStorage, Ownable, SepoliaConfig {
    using FHE for euint32;
    using FHE for euint64;

    // Error definitions
    error InvalidTokenId();
    error UnauthorizedAccess();

    // Events
    event ConfidentialMetadataUpdated(uint256 indexed tokenId);
    event ConfidentialAttributeSet(uint256 indexed tokenId, string traitType);

    // FHE state variables for confidential metadata
    mapping(uint256 => euint64) private _confidentialTokenData;
    mapping(uint256 => mapping(string => euint32)) private _confidentialAttributes;
    
    // Public metadata (non-confidential)
    mapping(uint256 => string) private _publicTokenURIs;
    
    // Access control for confidential data
    mapping(address => bool) private _authorizedDecryptors;

    constructor(string memory name, string memory symbol) 
        ERC721(name, symbol) 
        Ownable(msg.sender) 
    {
        _authorizedDecryptors[msg.sender] = true;
    }

    /**
     * @dev Mint a new NFT with confidential metadata
     */
    function mintWithConfidentialMetadata(
        address to,
        uint256 tokenId,
        string memory publicURI,
        externalEuint64 encryptedMetadata,
        bytes calldata inputProof
    ) external onlyOwner {
        _mint(to, tokenId);
        _setTokenURI(tokenId, publicURI);
        _publicTokenURIs[tokenId] = publicURI;
        
        // Convert externalEuint64 to euint64 using FHE.fromExternal
        euint64 confidentialData = FHE.fromExternal(encryptedMetadata, inputProof);
        
        // Store encrypted confidential metadata
        _confidentialTokenData[tokenId] = confidentialData;
        
        // Grant FHE permissions
        FHE.allowThis(confidentialData);
        FHE.allow(confidentialData, msg.sender);
        
        emit ConfidentialMetadataUpdated(tokenId);
    }

    /**
     * @dev Set confidential attribute for a token
     */
    function setConfidentialAttribute(
        uint256 tokenId,
        string memory traitType,
        externalEuint32 encryptedValue,
        bytes calldata inputProof
    ) external onlyOwner {
        if (ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        
        // Convert externalEuint32 to euint32 using FHE.fromExternal
        euint32 attributeValue = FHE.fromExternal(encryptedValue, inputProof);
        
        _confidentialAttributes[tokenId][traitType] = attributeValue;
        
        // Grant FHE permissions
        FHE.allowThis(attributeValue);
        FHE.allow(attributeValue, msg.sender);
        
        emit ConfidentialAttributeSet(tokenId, traitType);
    }

    /**
     * @dev Add authorized decryptor
     */
    function addAuthorizedDecryptor(address decryptor) external onlyOwner {
        _authorizedDecryptors[decryptor] = true;
    }

    /**
     * @dev Remove authorized decryptor
     */
    function removeAuthorizedDecryptor(address decryptor) external onlyOwner {
        _authorizedDecryptors[decryptor] = false;
    }

    /**
     * @dev Check if address is authorized to decrypt
     */
    function isAuthorizedDecryptor(address decryptor) external view returns (bool) {
        return _authorizedDecryptors[decryptor];
    }

    /**
     * @dev Get public metadata URI
     */
    function getPublicTokenURI(uint256 tokenId) external view returns (string memory) {
        if (ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        return _publicTokenURIs[tokenId];
    }

    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Custom burn function that clears confidential data
    function burnWithConfidentialData(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender || getApproved(tokenId) == msg.sender || isApprovedForAll(ownerOf(tokenId), msg.sender), "ERC721: caller is not token owner or approved");
        
        // Clear confidential data
        _confidentialTokenData[tokenId] = FHE.asEuint64(0);
        delete _publicTokenURIs[tokenId];
        
        // Burn the token
        _burn(tokenId);
    }
}
