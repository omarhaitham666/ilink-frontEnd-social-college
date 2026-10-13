
const api = {
    getCsrfCookie: function () {
        return $.ajax({
            url: CONFIG.API_BASE_URL + "/sanctum/csrf-cookie",
            method: "GET",
            xhrFields: {
                withCredentials: true
            }
        });
    },

    getXsrfToken: function () {
        const cookie = document.cookie
            .split("; ")
            .find(function (item) {
                return item.startsWith("XSRF-TOKEN=");
            });

        if (!cookie) {
            return null;
        }

        return decodeURIComponent(cookie.substring("XSRF-TOKEN=".length));
    },

    request: function (method, endpoint, data) {
        const sendRequest = function () {
            const options = {
                url: CONFIG.API_BASE_URL + endpoint,
                method: method,
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                }
            };

            if (data !== undefined) {
                options.contentType = "application/json";
                options.data = JSON.stringify(data);
            }

            if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
                const token = api.getXsrfToken();

                if (token) {
                    options.headers = {
                        "X-XSRF-TOKEN": token
                    };
                }
            }

            return $.ajax(options);
        };

        if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
            return api.getCsrfCookie().then(sendRequest);
        }

        return sendRequest();
    },

    get: function (endpoint) {
        return api.request("GET", endpoint);
    },

    post: function (endpoint, data) {
        return api.request("POST", endpoint, data);
    }
};
