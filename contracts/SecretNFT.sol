// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SecretNFT
 * @dev A complete NFT contract for the SecretNFT platform
 * Supports minting from the launch platform and metadata management
 */
contract SecretNFT is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _tokenIds;
    uint256 public maxSupply;
    bool public mintingEnabled = false;
    address public launchPlatform;
    string public baseURI;
    string public contractURIString;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event LaunchPlatformSet(address indexed platform);
    event MintingToggled(bool enabled);
    event BaseURISet(string baseURI);

    // Modifiers
    modifier onlyLaunchPlatform() {
        require(msg.sender == launchPlatform, "Only launch platform can call this");
        _;
    }

    modifier mintingOpen() {
        require(mintingEnabled, "Minting is not enabled");
        _;
    }

    /**
     * @dev Constructor
     * @param _name NFT collection name
     * @param _symbol NFT collection symbol
     * @param _maxSupply Maximum supply of NFTs
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        maxSupply = _maxSupply;
        baseURI = "";
    }

    /**
     * @dev Set the launch platform address
     * @param _launchPlatform Address of the launch platform
     */
    function setLaunchPlatform(address _launchPlatform) external onlyOwner {
        require(_launchPlatform != address(0), "Invalid address");
        launchPlatform = _launchPlatform;
        emit LaunchPlatformSet(_launchPlatform);
    }

    /**
     * @dev Enable minting
     */
    function enableMinting() external onlyOwner {
        mintingEnabled = true;
        emit MintingToggled(true);
    }

    /**
     * @dev Disable minting
     */
    function disableMinting() external onlyOwner {
        mintingEnabled = false;
        emit MintingToggled(false);
    }

    /**
     * @dev Mint a single NFT from the launch platform
     * @param to Recipient address
     * @param tokenURI Token metadata URI
     * @return tokenId The minted token ID
     */
    function mintFromPlatform(address to, string memory tokenURI) 
        external 
        onlyLaunchPlatform 
        mintingOpen 
        returns (uint256) 
    {
        require(_tokenIds < maxSupply, "Max supply reached");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        emit NFTMinted(to, newTokenId, tokenURI);
        
        return newTokenId;
    }

    /**
     * @dev Batch mint NFTs from the launch platform
     * @param to Recipient address
     * @param amount Number of NFTs to mint
     * @param baseTokenURI Base URI for token metadata
     */
    function batchMintFromPlatform(
        address to, 
        uint256 amount, 
        string memory baseTokenURI
    ) external onlyLaunchPlatform mintingOpen {
        require(_tokenIds + amount <= maxSupply, "Exceeds max supply");
        
        for (uint256 i = 0; i < amount; i++) {
            _tokenIds++;
            uint256 newTokenId = _tokenIds;
            
            string memory tokenURI = string(abi.encodePacked(baseTokenURI, "/", _toString(newTokenId)));
            
            _safeMint(to, newTokenId);
            _setTokenURI(newTokenId, tokenURI);
            
            emit NFTMinted(to, newTokenId, tokenURI);
        }
    }

    /**
     * @dev Mint NFTs for users after launch finalization
     * @param to Recipient address
     * @param amount Number of NFTs to mint
     */
    function mintForUser(address to, uint256 amount) external onlyLaunchPlatform mintingOpen {
        require(_tokenIds + amount <= maxSupply, "Exceeds max supply");
        
        for (uint256 i = 0; i < amount; i++) {
            _tokenIds++;
            uint256 newTokenId = _tokenIds;
            
            string memory tokenURI = string(abi.encodePacked(baseURI, "/", _toString(newTokenId)));
            
            _safeMint(to, newTokenId);
            _setTokenURI(newTokenId, tokenURI);
            
            emit NFTMinted(to, newTokenId, tokenURI);
        }
    }

    /**
     * @dev Set base URI for token metadata
     * @param _baseURI New base URI
     */
    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
        emit BaseURISet(_baseURI);
    }

    /**
     * @dev Set contract URI for marketplace metadata
     * @param _contractURI Contract metadata URI
     */
    function setContractURI(string memory _contractURI) external onlyOwner {
        contractURIString = _contractURI;
    }

    /**
     * @dev Get current token ID
     */
    function currentTokenId() external view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Get remaining mintable amount
     */
    function remainingSupply() external view returns (uint256) {
        return maxSupply - _tokenIds;
    }

    /**
     * @dev Get token URI with base URI support
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");

        string memory _tokenURI = super.tokenURI(tokenId);
        
        // If base URI is set, use it
        if (bytes(baseURI).length > 0) {
            return string(abi.encodePacked(baseURI, "/", _toString(tokenId)));
        }
        
        return _tokenURI;
    }

    /**
     * @dev Get contract URI for marketplace
     */
    function contractURI() external view returns (string memory) {
        return contractURIString;
    }

    /**
     * @dev Check if contract supports interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Internal function to convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        return value.toString();
    }


}
