import logo from '../img/logo.svg'
import tw from '../img/twitter.svg'
import disc from '../img/discord.svg'
import boat from '../img/boat.svg'
import Bubble from '../img/Bubble.svg'

function Footer() {
    return ( <footer>
        <div className='line1'></div>
        <div className='line2'></div>
        <div className="navigation">
            <a href='/' className="logo">
                <img src={logo} alt="logo" />
            </a>
            <ul>
                <li><a href="/#sectionTwo">Your Goldie</a></li>
            </ul>
        </div>
        <div className="social">
            <div className="bubble" style={{backgroundImage: `url(${Bubble})`}}><a target='_blank' href="https://twitter.com/nftgoldies"><img src={tw} alt="twitter icon" /></a></div>
            <div className="bubble" style={{backgroundImage: `url(${Bubble})`}}><a target='_blank' href="https://discord.gg/ccEDdGdk"><img src={disc} alt="discord icon" /></a></div>
            <div className="bubble" style={{backgroundImage: `url(${Bubble})`}}><a target='_blank' href="https://opensea.io/collection/goldienft"><img src={boat} alt="boat icon" /></a></div>
        </div>
    </footer> );
}

export default Footer;