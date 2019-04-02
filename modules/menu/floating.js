function floating(data, callback) {
    console.log(data);
    callback();
}

/**
 * @example
 * for example
 */

// line comment

function init() {
    floating('Float!', () => {
        console.log('floating finished');
    });
    console.log('Init floating');
}

init();