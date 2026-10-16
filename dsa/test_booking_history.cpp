
#include "include/BookingHistory.h"
#include <iostream>
#include <vector>
using namespace std;

Booking createTestBooking(string pnr, string name) {
    Passenger p;
    p.name = name;
    p.age = 20;
    p.gender = "Male";

    vector<Passenger> passengers = {p};
    vector<int> seats = {1};

    Booking b(pnr, "12317", "2026-10-20",
              passengers, seats, 500.0);

    b.setStatus("CONFIRMED");
    return b;
}

int main() {
    cout << "===== MEMORY CLEANUP TESTS =====\n\n";

    bool test1, test2, test3, test4, test5, test6;

    // TEST 1: Clear an already empty list.
    {
        BookingHistory history;

        cout << "TEST 1: Clear empty list\n";

        history.clear();

        test1 = history.isEmpty() &&
                history.getSize() == 0;

        cout << (test1 ? "PASSED" : "FAILED")
             << " - Empty list remains empty\n\n";
    }

    // TEST 2: Clear a list containing multiple bookings.
    {
        BookingHistory history;

        cout << "TEST 2: Clear list with multiple bookings\n";

        history.addBooking(createTestBooking("PNR1001", "Rahul"));
        history.addBooking(createTestBooking("PNR1002", "Priya"));
        history.addBooking(createTestBooking("PNR1003", "Aman"));

        cout << "Size before clear: "
             << history.getSize() << '\n';

        history.clear();

        test2 = history.isEmpty() &&
                history.getSize() == 0;

        cout << "Size after clear: "
             << history.getSize() << '\n';

        cout << (test2 ? "PASSED" : "FAILED")
             << " - All nodes cleared\n\n";
    }

    // TEST 3: Call clear twice.
    {
        BookingHistory history;

        cout << "TEST 3: Call clear twice\n";

        history.addBooking(createTestBooking("PNR1004", "Aman"));

        history.clear();
        history.clear();

        test3 = history.isEmpty() &&
                history.getSize() == 0;

        cout << (test3 ? "PASSED" : "FAILED")
             << " - No crash or incorrect count\n\n";
    }

    // TEST 4: Add a booking after clearing.
    {
        BookingHistory history;

        cout << "TEST 4: Add booking after clear\n";

        history.addBooking(createTestBooking("PNR2001", "Neha"));
        history.clear();
        history.addBooking(createTestBooking("PNR2002", "Rohan"));

        test4 = !history.isEmpty() &&
                history.getSize() == 1;

        cout << (test4 ? "PASSED" : "FAILED")
             << " - New booking can be added\n\n";
    }

    // TEST 5: Clear again after adding a new booking.
    {
        BookingHistory history;

        cout << "TEST 5: Clear after adding a new booking\n";

        history.addBooking(createTestBooking("PNR2003", "Neha"));
        history.clear();
        history.addBooking(createTestBooking("PNR2004", "Rohan"));
        history.clear();

        test5 = history.isEmpty() &&
                history.getSize() == 0;

        cout << (test5 ? "PASSED" : "FAILED")
             << " - List is empty again\n\n";
    }

    // TEST 6: Destructor cleanup.
    cout << "TEST 6: Destructor cleanup\n";

    {
        BookingHistory temporaryHistory;

        temporaryHistory.addBooking(
            createTestBooking("PNR3001", "Karan"));

        temporaryHistory.addBooking(
            createTestBooking("PNR3002", "Simran"));

        cout << "Temporary list size: "
             << temporaryHistory.getSize() << '\n';

        // The destructor runs automatically when this scope ends.
    }

    // Reaching this point means destruction completed without a crash.
    test6 = true;

    cout << (test6 ? "PASSED" : "FAILED")
         << " - Temporary object destroyed without a crash\n\n";

    if (test1 && test2 && test3 &&
        test4 && test5 && test6) {
        cout << "ALL MEMORY CLEANUP TESTS PASSED!\n";
    } else {
        cout << "SOME TESTS FAILED!\n";
    }

    return 0;
}
