import Header from '../components/Header';
import Hero from '../components/Hero';
import SectionOne from '../components/SectionOne';
import SectionTwo from '../components/SectionTwo';
import Faq from '../components/Faq';
import Footer from '../components/Footer';

function Home() {
    return ( <>
        <Header></Header>
        <Hero></Hero>
        <SectionOne></SectionOne>
        <SectionTwo></SectionTwo>
        <Faq></Faq>
        <Footer></Footer>
    </>);
}

export default Home;