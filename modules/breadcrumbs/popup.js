function popup(data, callback) {
    console.log(data);
    callback();
}

function init() {
    popup('Pop!', () => {
        console.log('popup finished');
    });
    console.log('Init popup');
}

init();