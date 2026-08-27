package domain

import (
	"testing"
	"time"
)

func TestForDate(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name        string
		on          time.Time
		boundaryDay int
		wantStart   time.Time
		wantEnd     time.Time
	}{
		{
			name:        "date on the boundary day starts the cycle on that day",
			on:          time.Date(2026, time.September, 30, 12, 0, 0, 0, time.UTC),
			boundaryDay: 30,
			wantStart:   time.Date(2026, time.September, 30, 0, 0, 0, 0, time.UTC),
			wantEnd:     time.Date(2026, time.October, 30, 0, 0, 0, 0, time.UTC),
		},
		{
			name:        "date the day before the boundary stays in the current cycle",
			on:          time.Date(2026, time.September, 29, 12, 0, 0, 0, time.UTC),
			boundaryDay: 30,
			wantStart:   time.Date(2026, time.August, 30, 0, 0, 0, 0, time.UTC),
			wantEnd:     time.Date(2026, time.September, 30, 0, 0, 0, 0, time.UTC),
		},
		{
			name:        "short month clamps the boundary for a date before it",
			on:          time.Date(2026, time.February, 27, 12, 0, 0, 0, time.UTC),
			boundaryDay: 30,
			wantStart:   time.Date(2026, time.January, 30, 0, 0, 0, 0, time.UTC),
			wantEnd:     time.Date(2026, time.February, 28, 0, 0, 0, 0, time.UTC),
		},
		{
			name:        "short month clamps the boundary for a date on the last day",
			on:          time.Date(2026, time.February, 28, 12, 0, 0, 0, time.UTC),
			boundaryDay: 30,
			wantStart:   time.Date(2026, time.February, 28, 0, 0, 0, 0, time.UTC),
			wantEnd:     time.Date(2026, time.March, 30, 0, 0, 0, 0, time.UTC),
		},
		{
			name:        "leap February clamps to the 29th",
			on:          time.Date(2028, time.February, 29, 12, 0, 0, 0, time.UTC),
			boundaryDay: 30,
			wantStart:   time.Date(2028, time.February, 29, 0, 0, 0, 0, time.UTC),
			wantEnd:     time.Date(2028, time.March, 30, 0, 0, 0, 0, time.UTC),
		},
		{
			name:        "31-day month with a 30-day boundary",
			on:          time.Date(2026, time.July, 31, 12, 0, 0, 0, time.UTC),
			boundaryDay: 30,
			wantStart:   time.Date(2026, time.July, 30, 0, 0, 0, 0, time.UTC),
			wantEnd:     time.Date(2026, time.August, 30, 0, 0, 0, 0, time.UTC),
		},
		{
			name:        "boundary 31 clamps in a 30-day month",
			on:          time.Date(2026, time.April, 30, 12, 0, 0, 0, time.UTC),
			boundaryDay: 31,
			wantStart:   time.Date(2026, time.April, 30, 0, 0, 0, 0, time.UTC),
			wantEnd:     time.Date(2026, time.May, 31, 0, 0, 0, 0, time.UTC),
		},
		{
			name:        "cycle crossing the year boundary",
			on:          time.Date(2027, time.January, 15, 12, 0, 0, 0, time.UTC),
			boundaryDay: 30,
			wantStart:   time.Date(2026, time.December, 30, 0, 0, 0, 0, time.UTC),
			wantEnd:     time.Date(2027, time.January, 30, 0, 0, 0, 0, time.UTC),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			got := ForDate(test.on, test.boundaryDay)
			if !got.Start.Equal(test.wantStart) {
				t.Errorf("Start = %v, want %v", got.Start, test.wantStart)
			}
			if !got.End.Equal(test.wantEnd) {
				t.Errorf("End = %v, want %v", got.End, test.wantEnd)
			}
		})
	}
}

func TestActiveAt(t *testing.T) {
	t.Parallel()

	bogota, err := time.LoadLocation("America/Bogota")
	if err != nil {
		t.Fatalf("load America/Bogota: %v", err)
	}

	tests := []struct {
		name      string
		now       time.Time
		settings  Settings
		wantStart time.Time
	}{
		{
			// 22:00 Sep 29 in America/Bogota is 03:00 UTC Sep 30; the
			// active cycle is still the one that started Aug 30.
			name:      "time zone decides the cycle near a boundary",
			now:       time.Date(2026, time.September, 30, 3, 0, 0, 0, time.UTC),
			settings:  Settings{BoundaryDay: 30, Location: bogota},
			wantStart: time.Date(2026, time.August, 30, 0, 0, 0, 0, bogota),
		},
		{
			name:      "one day later in the zone starts the new cycle",
			now:       time.Date(2026, time.October, 1, 3, 0, 0, 0, time.UTC),
			settings:  Settings{BoundaryDay: 30, Location: bogota},
			wantStart: time.Date(2026, time.September, 30, 0, 0, 0, 0, bogota),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			got := ActiveAt(test.now, test.settings)
			if !got.Start.Equal(test.wantStart) {
				t.Errorf("Start = %v, want %v", got.Start, test.wantStart)
			}
		})
	}
}
