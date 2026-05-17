import logo from '../img/logo.svg'
import tw from '../img/twitter.svg'
import disc from '../img/discord.svg'
import boat from '../img/boat.svg'
import { BrowserView, MobileView } from 'react-device-detect';
import menuBtn from '../img/menuButton.svg';
import { useState } from 'react';
import { Drawer } from '@mui/material';
import exit from '../img/exit.svg'
import bubble from '../img/Bubble.svg'

function Header() {

	const [state, setState] = useState(false);

	const toggleDrawer = () => {
		setState(state => !state);
	}

	return (<header>
		<div className="navigation">
			<a href='/' className="logo">
				<img src={logo} alt="logo" />
			</a>
			<BrowserView>
				<ul>
					<li><a href="/#sectionTwo">Your Goldie</a></li>
					<li><a href="/game">Play Game</a></li>
				</ul>
			</BrowserView>
		</div>
		<BrowserView>
			<div className="social">
				<div className="bubble" style={{ backgroundImage: `url(${bubble})` }}><a target='_blank' href="https://twitter.com/nftgoldies"><img src={tw} alt="twitter icon" /></a></div>
				<div className="bubble" style={{ backgroundImage: `url(${bubble})` }}><a target='_blank' href="https://discord.gg/ccEDdGdk"><img src={disc} alt="discord icon" /></a></div>
				<div className="bubble" style={{ backgroundImage: `url(${bubble})` }}><a target='_blank' href="https://opensea.io/collection/goldienft"><img src={boat} alt="boat icon" /></a></div>
			</div>
		</BrowserView>
		<MobileView>
			<div className="menu">
				<img onClick={toggleDrawer} src={menuBtn} alt="menu button" />
			</div>
		</MobileView>
		<Drawer anchor='right' open={state} onClose={toggleDrawer}>
			<div className="drawer">
				<div className='exit'><img onClick={toggleDrawer} src={exit} alt="exit button" /></div>
				<ul>
					<li><a onClick={toggleDrawer} href="/#sectionTwo">Your Goldie</a></li>
					<li><a onClick={toggleDrawer} href="/game">Play Game</a></li>
				</ul>
				<div className="social">
					<div className="bubble"><a target='_blank' href="https://twitter.com/nftgoldies"><img src={tw} alt="twitter icon" /></a></div>
					<div className="bubble"><a target='_blank' href="https://discord.gg/ccEDdGdk"><img src={disc} alt="discord icon" /></a></div>
					<div className="bubble"><a target='_blank' href="https://opensea.io/collection/goldienft"><img src={boat} alt="boat icon" /></a></div>
				</div>
			</div>
		</Drawer>
	</header>);
}

export default Header;