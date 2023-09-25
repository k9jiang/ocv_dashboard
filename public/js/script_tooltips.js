const tooltips = document.querySelectorAll('.tooltip');
const infoButtons = document.querySelectorAll('.info-button');

let isDisplayed = new Array(infoButtons.length).fill(false); // Tableau pour suivre l'état de chaque info-bulle

const handleInfoButtonClick = (index) => {
    return () => {
        if (!isDisplayed[index]) {
            tooltips[index].classList.remove('fade-out');
            tooltips[index].classList.add('fade-in');
            isDisplayed[index] = true;
        } else {
            tooltips[index].classList.remove('fade-in');
            tooltips[index].classList.add('fade-out');
            isDisplayed[index] = false;
        }
    };
};

const handleInfoButtonMouseEnter = (index) => {
    return () => {
        tooltips[index].classList.remove('fade-out');
        tooltips[index].classList.add('fade-in');
    };
};

const handleInfoButtonMouseLeave = (index) => {
    return () => {
        if (!isDisplayed[index]) {
            tooltips[index].classList.remove('fade-in');
            tooltips[index].classList.add('fade-out');
        }
    };
};

for (let i = 0; i < infoButtons.length; i++) {
    const handleClick = handleInfoButtonClick(i);
    const handleMouseEnter = handleInfoButtonMouseEnter(i);
    const handleMouseLeave = handleInfoButtonMouseLeave(i);

    infoButtons[i].addEventListener('click', handleClick);
    infoButtons[i].addEventListener('mouseenter', handleMouseEnter);
    infoButtons[i].addEventListener('mouseleave', handleMouseLeave);
}