import bg from '../img/hero.svg';
import fish1 from '../img/fishGroup1.svg';
import fish2 from '../img/fishGroup2.svg';

function Hero() {
    return ( <div className="hero" style={{backgroundImage: `url(${bg})`}}>
        <img className="fish1" src={fish1}></img>
        <img className="fish2" src={fish2}></img>
    </div> );
}

export default Hero;