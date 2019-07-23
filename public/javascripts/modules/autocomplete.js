function autocomplete(input, latInput, lngInput){
    if(!input) return; //slip this fn from running if there is not input on the page
    const dropdown = new google.maps.places.Autocomplete(input);
    dropdown.addListener('place_changed', () => {
        const place = dropdown.getPlace();
        latInput.value = place.geometry.location.lat();
        lngInput.value = place.geometry.location.lng();
    });
    //if someone hits enter on the address field, don't submit the form
    //Check out http://keycode.info/ for keys
    input.on('keydown', e => {
        console.log(e);
        if(e.which === 13) e.preventDefault();
    })
}

export default autocomplete;