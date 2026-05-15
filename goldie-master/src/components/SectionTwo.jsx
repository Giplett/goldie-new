import bg from '../img/poocloud.svg'
import gif1 from '../img/gif1.gif';

function SectionTwo() {
    return (<div id="sectionTwo">
        <div className="text">
            <h1 data-aos="fade-left">Your Goldie</h1>
            <p data-aos="fade-left">Each Goldie is unique and programmatically generated from over 113 possible traits, including facial expressions, headwear, clothing, and more!</p>
            <p data-aos="fade-left">Goldies are stored as ERC-721 tokens on the Ethereum blockchain!</p>
            <p data-aos="fade-left">More to come!</p>
        </div>
        <div className="img">
            <img src={gif1} alt="gif of changing nft fishes" />
        </div>
        <div className="bg" style={{ backgroundImage: `url(${bg})` }}></div>
    </div>);
}

export default SectionTwo;