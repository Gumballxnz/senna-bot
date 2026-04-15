
import FastSpeedtest from 'fast-speedtest-api'

const test = async () => {
    try {
        let speedtest = new FastSpeedtest({
            token: "YXA2MTY3OG53NHU0YTY5M3p6Y3Y=",
            verbose: true,
            timeout: 10000,
            https: true,
            urlCount: 5,
            bufferSize: 8,
            unit: FastSpeedtest.UNITS.Mbps
        })

        let speed = await speedtest.getSpeed()
        console.log(`Speed: ${speed} Mbps`)
    } catch (e) {
        console.error('Error:', e)
    }
}

test()
