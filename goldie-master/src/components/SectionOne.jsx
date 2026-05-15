import bg from '../img/specsBg.svg'

function SectionOne() {
	return (<div className="sectionOne" style={{ backgroundImage: `url(${bg})` }}>
		<div className="inner">
			<h1 data-aos="fade-left">The Beginning Of The Goldie Adventures </h1>
			<p data-aos="fade-left">Join us as Goldie begins his journey.</p>
			<p data-aos="fade-left">A story that people everywhere will enjoy. Goldie is in for some unexpected thrills. Join along, the fun awaits!</p>
		</div>
	</div>);
}

export default SectionOne;