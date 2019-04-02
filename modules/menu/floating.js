function floating(data, callback) {
    console.log(data);
    callback();
}

function init() {
    floating('Float!', () => {
        console.log('floating finished');
    });
    console.log('Init floating');
}

init();