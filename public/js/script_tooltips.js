const tooltips = document.querySelectorAll('.tooltip');
const infoButtons = document.querySelectorAll('.info-button');

const handleInfoButtonClick = (index) => {
    let isDisplayed = false;
    return () => {
        if (isDisplayed) {
            tooltips[index].classList.remove('fade-in');
            tooltips[index].classList.add('fade-out');
            isDisplayed = false;
            setTimeout(() => {
                tooltips[index].classList.remove('fade-out');
              }, 400);
        } 
        else {
            tooltips[index].classList.remove('fade-out');
            tooltips[index].classList.add('fade-in');
            isDisplayed = true;
        }
    };
};

for (let i = 0; i < infoButtons.length; i++) {
  const handleClick = handleInfoButtonClick(i);
  infoButtons[i].addEventListener('click', handleClick);
}