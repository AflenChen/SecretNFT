// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SecretNFTFactory
 * @dev Factory contract for creating new NFT collections
 * This contract allows users to deploy their own NFT collections
 */
// Launch contract interface
interface ISecretNFTLaunch {
    function registerNFTCollectionCreator(address _nftContract, address _creator) external;
}

contract SecretNFTFactory is Ownable, ReentrancyGuard {
    using Strings for uint256;

    // Events
    event NFTCollectionCreated(
        address indexed collectionAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 maxSupply
    );

    // NFT Collection template
    struct NFTCollection {
        address collectionAddress;
        address creator;
        string name;
        string symbol;
        uint256 maxSupply;
        uint256 totalSupply;
        bool isActive;
    }

    // Mapping to track all created collections
    mapping(address => NFTCollection) public collections;
    address[] public allCollections;

    // Fee for creating a collection (in ETH)
    uint256 public creationFee = 0.001 ether;
    
    // Launch contract address
    address public launchContractAddress;

    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Set launch contract address (owner only)
     * @param _launchContractAddress Address of the launch contract
     */
    function setLaunchContractAddress(address _launchContractAddress) external onlyOwner {
        launchContractAddress = _launchContractAddress;
    }

    /**
     * @dev Create a new NFT collection
     * @param _name Name of the collection
     * @param _symbol Symbol of the collection
     * @param _maxSupply Maximum supply of NFTs
     * @param _baseURI Base URI for token metadata
     */
    function createNFTCollection(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        string memory _baseURI
    ) external payable nonReentrant returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");
        require(_maxSupply > 0, "Max supply must be greater than 0");

        // Deploy new NFT collection
        SecretNFTCollection newCollection = new SecretNFTCollection(
            _name,
            _symbol,
            _maxSupply,
            _baseURI,
            msg.sender
        );

        address collectionAddress = address(newCollection);

        // Store collection info
        collections[collectionAddress] = NFTCollection({
            collectionAddress: collectionAddress,
            creator: msg.sender,
            name: _name,
            symbol: _symbol,
            maxSupply: _maxSupply,
            totalSupply: 0,
            isActive: true
        });

        allCollections.push(collectionAddress);

        emit NFTCollectionCreated(
            collectionAddress,
            msg.sender,
            _name,
            _symbol,
            _maxSupply
        );

        // Register the creator with the launch contract if it's set
        if (launchContractAddress != address(0)) {
            try ISecretNFTLaunch(launchContractAddress).registerNFTCollectionCreator(
                collectionAddress,
                msg.sender
            ) {
                // Registration successful
            } catch {
                // Registration failed, but don't revert the NFT creation
            }
        }

        return collectionAddress;
    }

    /**
     * @dev Get all collections created by a specific address
     * @param _creator Address of the creator
     * @return Array of collection addresses
     */
    function getCollectionsByCreator(address _creator) external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allCollections.length; i++) {
            if (collections[allCollections[i]].creator == _creator) {
                count++;
            }
        }

        address[] memory creatorCollections = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allCollections.length; i++) {
            if (collections[allCollections[i]].creator == _creator) {
                creatorCollections[index] = allCollections[i];
                index++;
            }
        }

        return creatorCollections;
    }

    /**
     * @dev Get all collections
     * @return Array of all collection addresses
     */
    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    /**
     * @dev Get collection info
     * @param _collectionAddress Address of the collection
     * @return Collection info
     */
    function getCollectionInfo(address _collectionAddress) external view returns (NFTCollection memory) {
        return collections[_collectionAddress];
    }

    /**
     * @dev Update creation fee (owner only)
     * @param _newFee New creation fee
     */
    function setCreationFee(uint256 _newFee) external onlyOwner {
        creationFee = _newFee;
    }

    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Failed to withdraw fees");
    }

    /**
     * @dev Get total number of collections
     * @return Total number of collections
     */
    function getTotalCollections() external view returns (uint256) {
        return allCollections.length;
    }
}

/**
 * @title SecretNFTCollection
 * @dev Individual NFT collection contract
 */
contract SecretNFTCollection is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event BaseURISet(string newBaseURI);
    event MaxSupplySet(uint256 newMaxSupply);

    // Collection properties
    uint256 public maxSupply;
    string public baseURI;
    uint256 private _tokenIds;
    bool public mintingEnabled = true;

    // Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        string memory _baseURI,
        address _owner
    ) ERC721(_name, _symbol) Ownable(_owner) {
        maxSupply = _maxSupply;
        baseURI = _baseURI;
    }

    /**
     * @dev Mint a new NFT
     * @param _to Address to mint to
     * @param _tokenURI Token URI for metadata
     */
    function mint(address _to, string memory _tokenURI) external onlyOwner nonReentrant {
        require(mintingEnabled, "Minting is disabled");
        require(_tokenIds < maxSupply, "Max supply reached");
        require(_to != address(0), "Cannot mint to zero address");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        emit NFTMinted(_to, newTokenId, _tokenURI);
    }

    /**
     * @dev Batch mint NFTs
     * @param _to Address to mint to
     * @param _tokenURIs Array of token URIs
     */
    function batchMint(address _to, string[] memory _tokenURIs) external onlyOwner nonReentrant {
        require(mintingEnabled, "Minting is disabled");
        require(_to != address(0), "Cannot mint to zero address");
        require(_tokenIds + _tokenURIs.length <= maxSupply, "Would exceed max supply");

        for (uint256 i = 0; i < _tokenURIs.length; i++) {
            _tokenIds++;
            uint256 newTokenId = _tokenIds;

            _safeMint(_to, newTokenId);
            _setTokenURI(newTokenId, _tokenURIs[i]);

            emit NFTMinted(_to, newTokenId, _tokenURIs[i]);
        }
    }

    /**
     * @dev Set base URI
     * @param _newBaseURI New base URI
     */
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURISet(_newBaseURI);
    }

    /**
     * @dev Set max supply
     * @param _newMaxSupply New max supply
     */
    function setMaxSupply(uint256 _newMaxSupply) external onlyOwner {
        require(_newMaxSupply >= _tokenIds, "New max supply cannot be less than current supply");
        maxSupply = _newMaxSupply;
        emit MaxSupplySet(_newMaxSupply);
    }

    /**
     * @dev Enable/disable minting
     * @param _enabled Whether minting should be enabled
     */
    function setMintingEnabled(bool _enabled) external onlyOwner {
        mintingEnabled = _enabled;
    }

    /**
     * @dev Get total supply
     * @return Total number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Get token URI
     * @param tokenId Token ID
     * @return Token URI
     */
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.tokenURI(tokenId);
    }

    /**
     * @dev Set token URI
     * @param tokenId Token ID
     * @param _tokenURI Token URI
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual override(ERC721URIStorage) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _tokenURIs[tokenId] = _tokenURI;
    }

    /**
     * @dev Required override
     */
    function _baseURI() internal view virtual override(ERC721) returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Required override
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
