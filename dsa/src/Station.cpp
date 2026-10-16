
#include "../include/Station.h"
#include <iostream>

using namespace std;

Station::Station() {}

Station::Station(
    string stationCode,
    string stationName,
    string stationCity,
    string stationState
)
    : code(stationCode),
      name(stationName),
      city(stationCity),
      state(stationState) {}

string Station::getCode() const {
    return code;
}

string Station::getName() const {
    return name;
}

string Station::getCity() const {
    return city;
}

string Station::getState() const {
    return state;
}

void Station::display() const {
    cout << "Station Code : " << code << '\n'
         << "Station Name : " << name << '\n'
         << "City         : " << city << '\n'
         << "State        : " << state << '\n';
}
