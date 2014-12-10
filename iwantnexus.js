$(function() {
	var device_url = window.location.href;
	var device_title = document.title;
	var add_to_cart = $('button.buy');

	if (add_to_cart.is(':enabled')) {
		add_to_cart.click();

		console.log('The device is available. Loading API key and devices to push to.');

		chrome.storage.sync.get(
			{
				api_key: '',
				devices: []
			},
			function(items) {
				PushBullet.APIKey = items.api_key;
				console.log('Pushing to ' + items.devices.length + ' devices');

				$.each(items.devices, function(index, device_iden) {
					console.log('Pushing to device ' + index + ': ' + device_iden);
					PushBullet.push("link", device_iden, null, { title: "Device available - " + device_title, url: device_url });
				});

				$('#hardware-checkout').click();
			}
		);
	}
	else {
		chrome.storage.sync.get(
			{
				refresh_interval: 1000
			},
			function(items) {
				setTimeout(
					function() {
						window.location.reload();
					},
					items.refresh_interval
				);
			}
		);
	}
});
