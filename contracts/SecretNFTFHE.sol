// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TFHE} from "@fhevm/solidity/TFHE.sol";

/**
 * @title SecretNFTFHE
 * @dev An ERC721 NFT contract with FHE capabilities for confidential metadata
 */
contract SecretNFTFHE is ERC721, ERC721URIStorage, Ownable {
    using TFHE for euint32;
    using TFHE for euint64;

    // Error definitions
    error FHEOperationFailed();
    error InvalidTokenId();
    error UnauthorizedAccess();

    // Events
    event ConfidentialMetadataUpdated(uint256 indexed tokenId, bytes encryptedMetadata);
    event ConfidentialAttributeSet(uint256 indexed tokenId, string traitType, bytes encryptedValue);

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
     * @param to Recipient address
     * @param tokenId Token ID
     * @param publicURI Public metadata URI
     * @param encryptedMetadata Encrypted confidential metadata
     */
    function mintWithConfidentialMetadata(
        address to,
        uint256 tokenId,
        string memory publicURI,
        bytes calldata encryptedMetadata
    ) external onlyOwner {
        _mint(to, tokenId);
        _setTokenURI(tokenId, publicURI);
        _publicTokenURIs[tokenId] = publicURI;
        
        // Store encrypted confidential metadata
        _confidentialTokenData[tokenId] = TFHE.asEuint64(encryptedMetadata);
        
        emit ConfidentialMetadataUpdated(tokenId, encryptedMetadata);
    }

    /**
     * @dev Set confidential attribute for a token
     * @param tokenId Token ID
     * @param traitType Attribute type (e.g., "rarity", "power")
     * @param encryptedValue Encrypted attribute value
     */
    function setConfidentialAttribute(
        uint256 tokenId,
        string memory traitType,
        bytes calldata encryptedValue
    ) external onlyOwner {
        if (!_exists(tokenId)) revert InvalidTokenId();
        
        _confidentialAttributes[tokenId][traitType] = TFHE.asEuint32(encryptedValue);
        
        emit ConfidentialAttributeSet(tokenId, traitType, encryptedValue);
    }

    /**
     * @dev Get confidential metadata (encrypted)
     * @param tokenId Token ID
     */
    function getConfidentialMetadata(uint256 tokenId) external view returns (bytes memory) {
        if (!_exists(tokenId)) revert InvalidTokenId();
        return TFHE.encrypt(_confidentialTokenData[tokenId]);
    }

    /**
     * @dev Get confidential attribute (encrypted)
     * @param tokenId Token ID
     * @param traitType Attribute type
     */
    function getConfidentialAttribute(
        uint256 tokenId, 
        string memory traitType
    ) external view returns (bytes memory) {
        if (!_exists(tokenId)) revert InvalidTokenId();
        return TFHE.encrypt(_confidentialAttributes[tokenId][traitType]);
    }

    /**
     * @dev Decrypt confidential metadata (authorized users only)
     * @param tokenId Token ID
     */
    function decryptConfidentialMetadata(uint256 tokenId) external view returns (uint256) {
        if (!_exists(tokenId)) revert InvalidTokenId();
        if (!_authorizedDecryptors[msg.sender]) revert UnauthorizedAccess();
        
        return TFHE.decrypt(_confidentialTokenData[tokenId]);
    }

    /**
     * @dev Decrypt confidential attribute (authorized users only)
     * @param tokenId Token ID
     * @param traitType Attribute type
     */
    function decryptConfidentialAttribute(
        uint256 tokenId, 
        string memory traitType
    ) external view returns (uint256) {
        if (!_exists(tokenId)) revert InvalidTokenId();
        if (!_authorizedDecryptors[msg.sender]) revert UnauthorizedAccess();
        
        return TFHE.decrypt(_confidentialAttributes[tokenId][traitType]);
    }

    /**
     * @dev Add authorized decryptor
     * @param decryptor Address to authorize
     */
    function addAuthorizedDecryptor(address decryptor) external onlyOwner {
        _authorizedDecryptors[decryptor] = true;
    }

    /**
     * @dev Remove authorized decryptor
     * @param decryptor Address to revoke authorization
     */
    function removeAuthorizedDecryptor(address decryptor) external onlyOwner {
        _authorizedDecryptors[decryptor] = false;
    }

    /**
     * @dev Check if address is authorized to decrypt
     * @param decryptor Address to check
     */
    function isAuthorizedDecryptor(address decryptor) external view returns (bool) {
        return _authorizedDecryptors[decryptor];
    }

    /**
     * @dev Get public metadata URI
     * @param tokenId Token ID
     */
    function getPublicTokenURI(uint256 tokenId) external view returns (string memory) {
        if (!_exists(tokenId)) revert InvalidTokenId();
        return _publicTokenURIs[tokenId];
    }

    /**
     * @dev Perform FHE operations on confidential data
     * @param tokenId1 First token ID
     * @param tokenId2 Second token ID
     */
    function compareConfidentialData(uint256 tokenId1, uint256 tokenId2) external view returns (bool) {
        if (!_exists(tokenId1) || !_exists(tokenId2)) revert InvalidTokenId();
        if (!_authorizedDecryptors[msg.sender]) revert UnauthorizedAccess();
        
        // Compare confidential data using FHE operations
        euint64 data1 = _confidentialTokenData[tokenId1];
        euint64 data2 = _confidentialTokenData[tokenId2];
        
        // Return true if data1 > data2 (this would need to be implemented with proper FHE comparison)
        return TFHE.gt(data1, data2);
    }

    /**
     * @dev Aggregate confidential attributes
     * @param tokenId Token ID
     * @param traitTypes Array of trait types to aggregate
     */
    function aggregateConfidentialAttributes(
        uint256 tokenId,
        string[] memory traitTypes
    ) external view returns (bytes memory) {
        if (!_exists(tokenId)) revert InvalidTokenId();
        if (!_authorizedDecryptors[msg.sender]) revert UnauthorizedAccess();
        
        euint32 aggregated = TFHE.asEuint32(0);
        
        for (uint256 i = 0; i < traitTypes.length; i++) {
            aggregated = TFHE.add(aggregated, _confidentialAttributes[tokenId][traitTypes[i]]);
        }
        
        return TFHE.encrypt(aggregated);
    }

    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clear confidential data
        delete _confidentialTokenData[tokenId];
        delete _publicTokenURIs[tokenId];
    }
}
